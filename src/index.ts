import fastify from "fastify";
import cors from "@fastify/cors";
import { registerUserRoutes } from "./routes/usersRoutes";
import { registerPatientRoutes } from "./routes/patientsRoutes";
import { registerJobRoutes } from "./routes/jobsRoutes";
import { registerJobApplicationRoutes } from "./routes/jobApplicationsRoutes";

const app = fastify({ logger: true });

app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

app.get("/", async (_, reply) => {
  return reply.send({ message: "🚀 API Fastify rodando com sucesso!" });
});

registerUserRoutes(app);
registerPatientRoutes(app);
registerJobRoutes(app);
registerJobApplicationRoutes(app);

app.listen({ host: "0.0.0.0", port: Number(process.env.PORT) || 3333 })
  .then(() => console.log("✅ Servidor Funcionando!"))
  .catch(err => {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  });