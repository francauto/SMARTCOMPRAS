import pool from "../config/db";

export async function getDiretoria() {
    let connection;
    connection = await pool.getConnection();

    try{
        const [diretoria]: any = await connection.query(
            `SELECT id, nome FROM Funcionarios WHERE cargo = 'dir' or cargo = 'admdir'`,
        );
        return diretoria;
    }catch (error) {
        console.error("Erro ao buscar diretoria:", error);
        throw error;
    }finally {
        connection.release();
    }
}

export async function getGerentes() {
    let connection;
    connection = await pool.getConnection();
    try{
        const [gerentes]: any = await connection.query(
            `SELECT id,nome FROM Funcionarios WHERE cargo = 'ger' or cargo= 'admger'`,
        );
        return gerentes;
    }catch (error) {
        console.error("Erro ao buscar gerentes:", error);
        throw error;
    }finally {
        connection.release();
    }   
}

export async function getAprovadores() {
    let connection;
    connection = await pool.getConnection();

    try{
        const [aprovadores]: any = await connection.query(
            `SELECT id, nome FROM Funcionarios WHERE cargo IN ('ger', 'admger', 'dir', 'admdir')`,
        );
        return aprovadores;
    }catch (error) {
        console.error("Erro ao buscar aprovadores:", error);
        throw error;
    }finally {
        connection.release();
    }
}