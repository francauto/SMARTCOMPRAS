import axios from "axios";

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<void> {
  try {
    const apiUrl = process.env.API_WPP_URL;

    if (!apiUrl) {
      throw new Error("API_WPP_URL não configurada no arquivo .env");
    }

    await axios.post(
      apiUrl,
      {
        number: phone,
        body: message,
      },
      {
        headers: {
          Authorization: `Bearer a2asq151f7q8a1fw86asa`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    throw new Error("Falha ao enviar mensagem via WhatsApp");
  }
}
