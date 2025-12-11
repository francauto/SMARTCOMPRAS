import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "../config/db";
import bcrypt from "bcrypt";
import { IUsuario, IUpdateUsuario } from "../interfaces/admin.interface";

export async function getAllUsuarios(): Promise<IUsuario[]> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT 
        f.id, f.nome, f.sobrenome, f.usuario, f.cargo, f.mail, f.telefone, 
        f.aut_wpp, f.ativo, f.id_departamento, f.master , f.verificador, cb.cargo as cargo_bestdrive
      FROM Funcionarios f
      LEFT JOIN cargos_bestdrive cb ON f.cargo_bestdrive_id  = cb.id 
      ORDER BY f.id;
    `;
    const [usuarios] = await connection.query<IUsuario[]>(query);
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar todos os usuários:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateUsuario(
  id: number,
  dados: IUpdateUsuario
): Promise<{ message: string }> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();

    
    const [usuarios] = await connection.query<IUsuario[]>(
      `SELECT id FROM Funcionarios WHERE id = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      throw new Error("Usuário não encontrado");
    }


    const campos: string[] = [];
    const valores: any[] = [];

    if (dados.nome !== undefined) {
      campos.push("nome = ?");
      valores.push(dados.nome);
    }
    if (dados.sobrenome !== undefined) {
      campos.push("sobrenome = ?");
      valores.push(dados.sobrenome);
    }
    if (dados.usuario !== undefined) {
      campos.push("usuario = ?");
      valores.push(dados.usuario);
    }
    if (dados.cargo !== undefined) {
      campos.push("cargo = ?");
      valores.push(dados.cargo);
    }
    if (dados.mail !== undefined) {
      campos.push("mail = ?");
      valores.push(dados.mail);
    }
    if (dados.telefone !== undefined) {
      campos.push("telefone = ?");
      valores.push(dados.telefone);
    }
    if (dados.aut_wpp !== undefined) {
      campos.push("aut_wpp = ?");
      valores.push(dados.aut_wpp);
    }
    if (dados.ativo !== undefined) {
      campos.push("ativo = ?");
      valores.push(dados.ativo);
    }
    if (dados.id_departamento !== undefined) {
      campos.push("id_departamento = ?");
      valores.push(dados.id_departamento);
    }
    if (dados.master !== undefined) {
      campos.push("master = ?");
      valores.push(dados.master);
    }
    if (dados.verificador !== undefined) {
      campos.push("verificador = ?");
      valores.push(dados.verificador);
    }
    if (dados.cargo_bestdrive_id !== undefined) {
      campos.push("cargo_bestdrive_id = ?");
      valores.push(dados.cargo_bestdrive_id);
    }

    if (dados.cargo_bestdrive !== undefined) {
      const [cargos] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM cargos_bestdrive WHERE cargo = ?`,
        [dados.cargo_bestdrive]
      );

      if (cargos.length === 0) {
        throw new Error(
          `Cargo "${dados.cargo_bestdrive}" não encontrado na tabela cargos_bestdrive`
        );
      }

      campos.push("cargo_bestdrive_id = ?");
      valores.push(cargos[0].id);
    }

    if (campos.length === 0) {
      throw new Error("Nenhum campo fornecido para atualização");
    }

    valores.push(id);

    const query = `UPDATE Funcionarios SET ${campos.join(", ")} WHERE id = ?`;
    await connection.query<ResultSetHeader>(query, valores);

    return { message: "Usuário atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function resetSenhaUsuario(
  id: number
): Promise<{ message: string }> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();


    const [usuarios] = await connection.query<IUsuario[]>(
      `SELECT id, usuario FROM Funcionarios WHERE id = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // Criptografar a senha padrão "Tr0c@r123"
    const novaSenha = "Tr0c@r123";
    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha
    await connection.query<ResultSetHeader>(
      `UPDATE Funcionarios SET senha = ? WHERE id = ?`,
      [hashedPassword, id]
    );

    return {
      message: `Senha do usuário "${usuarios[0].usuario}" foi redefinida para "Tr0c@r123"`,
    };
  } catch (error) {
    console.error("Erro ao resetar senha do usuário:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
