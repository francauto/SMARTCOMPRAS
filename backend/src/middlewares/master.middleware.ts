import { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import { RowDataPacket } from "mysql2/promise";

/**
 * Middleware para validar permissão Master
 *
 * Deve ser usado APÓS o middleware de autenticação (authenticate)
 * para garantir que req.user já está populado
 */
export class MasterMiddleware {
  /**
   * Valida se o usuário autenticado possui permissão Master (master = 1)
   */
  public validateMasterPermission = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Verificar se o usuário está autenticado
      if (!req.user || !req.user.id) {
        res.status(401).json({
          error:
            "Usuário não autenticado. Utilize o middleware de autenticação primeiro.",
        });
        return;
      }

      const id_usuario = req.user.id;

      // Buscar no banco se o usuário tem permissão Master
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT id, nome, cargo, master FROM Funcionarios WHERE id = ?`,
          [id_usuario]
        );

        if (!rows.length) {
          res.status(404).json({ error: "Usuário não encontrado." });
          return;
        }

        const usuario = rows[0];

        // Validar se possui flag master = 1
        if (!usuario.master || usuario.master !== 1) {
          res.status(403).json({
            error: "Acesso negado. Você não possui permissão Master.",
            details:
              "Esta funcionalidade é restrita a usuários com permissão Master.",
          });
          return;
        }

        // Adicionar informações completas do usuário ao request
        req.user = {
          ...req.user,
          nome: usuario.nome,
          cargo: usuario.cargo,
          master: usuario.master,
        };

        next();
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error("Erro ao validar permissão Master:", error.message);
      res.status(500).json({
        error: "Erro ao validar permissão Master.",
        details: error.message,
      });
      return;
    }
  };
}

export default new MasterMiddleware();
