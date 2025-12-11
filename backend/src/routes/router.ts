import { Router } from "express";
import auth from "./auth.routes";
import estoque from "./estoque.routes";
import admin from "./admin.routes";
import cliente from "./cliente.routes";
import frota from "./frota.routes";
import combustivelEstoque from "./combustivel-estoque.routes";
import despesas from "./despesas.routes";
import apiBestDriveRoutes from "./apiBestDrive.routes";
import aprovers from "./getAprovers.routes";
import departamentos from "./departamentos.routes";
import hash from "./hash.routes";
import printer from "./printer.routes";
import calculateConsumo from "./calculateConsumo.routes";
import master from "./master.routes";
import relatoriosEstoque from "./relatorios/estoque.routes";
import relatoriosCombustivelEstoque from "./relatorios/combustivel-estoque.routes";
import relatoriosCliente from "./relatorios/cliente.routes";
import relatoriosDespesas from "./relatorios/despesas.routes";

const router = Router();

router.use("/auth", auth);
router.use("/estoque", estoque);
router.use("/admin", admin);
router.use("/clientes", cliente);
router.use("/frota", frota);
router.use("/combustivel-estoque", combustivelEstoque);
router.use("/despesas", despesas);
router.use("/apiBestDrive", apiBestDriveRoutes);
router.use("/aprovers", aprovers);
router.use("/departamentos", departamentos);
router.use("/hash", hash);
router.use("/printer", printer);
router.use("/calculateConsumo", calculateConsumo);
router.use("/master", master);
router.use("/relatorios/estoque", relatoriosEstoque);
router.use("/relatorios/combustivel-estoque", relatoriosCombustivelEstoque);
router.use("/relatorios/cliente", relatoriosCliente);
router.use("/relatorios/despesas", relatoriosDespesas);

router.get("/", (req, res) => {
  res.json({ message: "API online" });
});

export default router;
