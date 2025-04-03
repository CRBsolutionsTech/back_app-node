import fastify from "fastify";
import { supabase } from "./supabaseConnection";
import bcrypt from "bcryptjs";

const app = fastify();

type User = {
    name: string;
    email: string;
    password: string;
    registro: string;
    cpf: string;
    celular: string;
};

// ✅ Rota principal (Home)
app.get("/", async (request, reply) => {
    return reply.send({ message: "🚀 API Fastify rodando com sucesso!" });
});

// ✅ Rota GET - Buscar usuários
app.get("/users", async (request, reply) => {
    try {
        const { data: users, error } = await supabase.from("users").select("*");
        if (error) throw new Error(error.message);

        return reply.send({ users });
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return reply.status(500).send({ error: "Erro ao buscar usuários." });
    }
});

app.post("/users", async (request, reply) => {
    try {
        console.log("Dados recebidos:", request.body); // 👀 Verificar dados

        const { name, email, password, registro, cpf, celular } = request.body as User;

        if (!name || !email || !password || !registro || !cpf || !celular) {
            return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: createdUser, error } = await supabase
            .from("users")
            .insert([{ name, email, password: hashedPassword, registro, cpf, celular }])
            .select();

        if (error) return reply.status(400).send({ error: error.message });

        return reply.status(201).send({ user: createdUser ? createdUser[0] : null });
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        return reply.status(500).send({ error: "Erro ao criar usuário." });
    }
});


// ✅ Iniciar servidor
app.listen({
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then(() => {
    console.log("✅ Servidor Funcionando!");
}).catch(err => {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
});
