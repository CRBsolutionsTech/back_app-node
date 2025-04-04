import fastify from "fastify";
import { supabase } from "./supabaseConnection";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = fastify();
const SECRET_KEY = "seu_segredo_super_seguro"; // 🔑 Defina uma chave segura

type Users = {
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
app.get("/register", async (request, reply) => {
    try {
        const { data: register, error } = await supabase.from("register").select("*");
        if (error) throw new Error(error.message);

        return reply.send({ register });
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return reply.status(500).send({ error: "Erro ao buscar usuários." });
    }
});

// ✅ Rota POST - Criar usuário
app.post("/register", async (request, reply) => {
    try {
        const { name, email, password, registro, cpf, celular } = request.body as Users;

        if (!name || !email || !password || !registro || !cpf || !celular) {
            return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: createdUser, error } = await supabase
            .from("register")
            .insert([{ name, email, password: hashedPassword, registro, cpf, celular }])
            .select();

        if (error) return reply.status(400).send({ error: error.message });

        return reply.status(201).send({ register: createdUser ? createdUser[0] : null });
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        return reply.status(500).send({ error: "Erro ao criar usuário." });
    }
});

// ✅ Rota POST - Login usando CPF
app.post("/login", async (request, reply) => {
    try {
        const { cpf, password } = request.body as { cpf: string; password: string };

        if (!cpf || !password) {
            return reply.status(400).send({ error: "CPF e senha são obrigatórios." });
        }

        const { data: user, error: userError } = await supabase
            .from("register")
            .select("cpf, password, name, email")
            .eq("cpf", cpf)
            .single();

        if (userError || !user) {
            return reply.status(404).send({ error: "CPF não encontrado." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return reply.status(401).send({ error: "Senha incorreta." });
        }

        const token = jwt.sign(
            { cpf: user.cpf, name: user.name, email: user.email }, 
            SECRET_KEY, 
            { expiresIn: "1h" }
        );

        return reply.send({ message: "Login bem-sucedido!", token });
    } catch (error) {
        console.error("Erro no login:", error);
        return reply.status(500).send({ error: "Erro ao fazer login." });
    }
});

// ✅ Rota POST - Resetar senha pelo e-mail
app.post("/reset-password", async (request, reply) => {
    try {
        const { email, newPassword } = request.body as { email: string; newPassword: string };

        if (!email || !newPassword) {
            return reply.status(400).send({ error: "E-mail e nova senha são obrigatórios." });
        }

        const { data: user, error: userError } = await supabase
            .from("register")
            .select("email")
            .eq("email", email)
            .single();

        if (userError || !user) {
            return reply.status(404).send({ error: "Usuário não encontrado." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error } = await supabase
            .from("register")
            .update({ password: hashedPassword })
            .eq("email", email);

        if (error) return reply.status(400).send({ error: error.message });

        return reply.send({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        return reply.status(500).send({ error: "Erro ao redefinir senha." });
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