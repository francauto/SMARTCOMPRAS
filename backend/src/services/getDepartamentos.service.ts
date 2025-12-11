import pool from "../config/db";


export async function getDepartamentosService() {
    let connection;
    connection = await pool.getConnection();
    try{
        const [departamentos]: any = await connection.query(
            `SELECT id, nome FROM Departamentos ORDER BY nome ASC`,
        );
        return departamentos;
    }catch (error) {
        console.error("Erro ao buscar departamentos:", error);
        throw error;
    }finally {
        connection.release();
    }

}
