import pool from "../config/db";


export async function buscaHashService(hash: string) {
    let connection;
    connection = await pool.getConnection();
    try{
        const [hashResult]: any = await connection.query(
            `SELECT rr.*, f.nome AS funcionario_nome FROM request_relations rr 
            LEFT JOIN Funcionarios f ON rr.funcionario_validador = f.id 
            WHERE rr.hash_code = ?`,
            [hash]
        );
        return hashResult;

    }catch (error) {
        console.error("Erro ao buscar hash:", error);
        throw error;
    }finally {
        connection.release();
    }
}

export async function atualizaUsoHashService(hash_code: string, funcionario_validador: string) {
    let connection;
    connection = await pool.getConnection();

    try{

        await connection.beginTransaction();


        const [hashUpdate]: any = await connection.query(
            `UPDATE request_relations SET usado = 1, funcionario_validador = ? WHERE hash_code = ?`,
            [funcionario_validador, hash_code]

        )
        if(hashUpdate.affectedRows === 0){
            await connection.rollback();
             throw new Error("Nenhum hash encontrado para atualizar o uso");
             
        }
        

        await connection.commit();
        return {status: true, message: "Hash atualizado com sucesso"};
    }catch (error) {
        console.error("Erro ao atualizar uso do hash:", error);
        await connection.rollback();
        throw error;
      
    }finally {
        connection.release();
    }

}