import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConsumoVeiculo, AnaliseConsumoIA } from "../interfaces/consumo.interface";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function analyzeCupomImage(imagePath: string) {
  try {
    console.log("Enviando imagem para Google Gemini");

    const imageBase64 = fs.readFileSync(imagePath).toString("base64");

    const prompt = `
      Analise a imagem de um cupom fiscal e retorne **somente** um JSON puro com os seguintes campos:
      - "litros": quantidade abastecida
      - "valor_por_litro": preço unitário
      - "valor_total": valor total
      - "placa": placa do veículo
      - "condutor": nome do motorista
      Não inclua explicações, blocos de código, ou markdown. Retorne apenas JSON válido.
    `;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
    ]);

    const text = result.response.text();
  

    const cleaned = text
      .replace(/```json|```/g, "") // remove blocos markdown
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1") // mantém apenas o trecho entre { }
      .replace(/[\u0000-\u001F]+/g, "") // remove caracteres invisíveis
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      console.log(" JSON convertido com sucesso:", parsed);
      return parsed;
    } catch (err) {
      console.warn("Falha ao converter diretamente, aplicando regex secundário...");


      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log("JSON extraído via regex:", parsed);
          return parsed;
        } catch (innerErr) {
          console.error("Falha ao parsear mesmo após regex:", innerErr);
        }
      }

      return {
        raw_output: cleaned,
        error: "Falha ao converter resposta em JSON mesmo após limpeza.",
      };
    }
  } catch (error) {
    console.error("Erro no serviço de IA:", error);
    throw new Error("Falha ao processar a imagem no Google AI.");
  }
}

export async function analisarConsumoGemini(consumos: ConsumoVeiculo[]): Promise<AnaliseConsumoIA> {
  try {
    if (!consumos.length) {
      return { resumo: "Nenhum dado disponível para análise.", alertas: [] };
    }

    const dadosTexto = consumos
      .map(
        (c) => `
        Veículo ${c.veiculo_id}:
        - Km inicial: ${c.km_inicial}
        - Km final: ${c.km_final}
        - Km rodado: ${c.km_rodado}
        - Litros: ${c.litros_abastecidos}
        - Valor gasto: R$${c.valor_gasto}
        - Consumo médio: ${c.consumo_medio_km_por_litro} km/l
        - Custo por km: R$${c.custo_por_km}
      `
      )
      .join("\n");

const prompt = `
Você é um analista de frotas responsável por avaliar o consumo de combustível de veículos corporativos.

Analise os dados abaixo e retorne APENAS um JSON puro com os seguintes campos:
{
  "resumo": "Resumo geral objetivo sobre o consumo da frota",
  "alertas": ["Observações diretas sobre veículos com consumo anormal ou custo alto"],
  "recomendacoes": ["Dicas curtas e práticas focadas em uso e manutenção dos veículos"]
}

Instruções importantes:
- Baseie-se APENAS nos dados fornecidos.
- NÃO crie recomendações genéricas (ex: “dirija melhor” ou “faça revisões regulares”).
- Seja técnico, conciso e relevante (ex: “Verificar calibragem dos pneus do veículo X”, “Possível excesso de marcha lenta no veículo Y”).
- Se tudo estiver dentro da média, apenas diga no resumo que “o consumo está dentro do esperado”.
- NÃO use blocos de código, markdown ou texto fora do JSON.
- Responda apenas com JSON válido.

Dados:
${dadosTexto}
`;


    const result = await model.generateContent([{ text: prompt }]);
    const rawText = result.response.text();

    const cleaned = rawText
      .replace(/```json|```/g, "")
      .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("Falha ao converter resposta da IA em JSON.");
    }
  } catch (error) {
    console.error("Erro ao analisar consumo via Gemini:", error);
    return {
      resumo: "Erro ao gerar análise com IA.",
      alertas: ["Falha na integração com o modelo Gemini."],
    };
  }
}
