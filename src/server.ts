import fastify from "fastify";
import { supabase } from "./supabaseConnection";
import bcrypt from "bcryptjs";

const app = fastify();

type Users = {
    name: string
    registro: string
    cpf: string
    celular: string
    email: string
    password: string
    newPassword: string
};

type Register = {
    name: string
    registro: string
    cpf: string
    celular: string
    email: string
    password: string
    newPassword: string
};

// Rota GET para buscar usuários
app.get("/users", async (request, reply) => {
    try {
        const { data: users, error } = await supabase.from("users").select("*");
        if (error) {
            throw new Error(error.message);
        }
        return reply.send({ value: users });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Erro ao buscar usuários" });
    }
});

// Rota POST para criar usuários
app.post("/users", async (request, reply) => {
    try {
        const { name, registro, cpf, celular, email, password } = request.body as Users;

        const { data: createdUser, error } = await supabase.from("users").insert([{ 
            name,
            registro,
            cpf,
            celular, 
            email, 
            password 
        }]).select();

        if (error) {
            return reply.status(400).send({ error: error.message });
        }

        return reply.status(201).send({ value: createdUser ? createdUser[0] : null });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Erro ao criar usuário" });
    }
});

// ✅ Rota para redefinir senha sem token
app.post("/update-password", async (request, reply) => {
    try {
        const { email, newPassword } = request.body as { email: string; newPassword: string };

        if (!email || !newPassword) {
            return reply.status(400).send({ error: "E-mail e nova senha são obrigatórios." });
        }

        // Hash da nova senha para segurança
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        // Atualiza a senha no banco, onde o email for igual ao informado
        const { error } = await supabase
            .from("users")
            .update({ password: hashedPassword })
            .eq("email", email);

        if (error) {
            return reply.status(400).send({ error: error.message });
        }

        return reply.send({ message: "Senha redefinida com sucesso!" });

    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Erro ao redefinir senha." });
    }
});

// Rota GET para registrar usuários
app.get("/register", async (request, reply) => {
    try {
        const { data: register, error } = await supabase.from("register").select("*");
        if (error) {
            throw new Error(error.message);
        }
        return reply.send({ value: register });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Erro ao buscar usuários" });
    }
});

// Rota POST para registrar usuários
app.post("/register", async (request, reply) => {
    try {
        const { name, registro, cpf, celular, email, password } = request.body as Register;

        const { data: createdRegister, error } = await supabase.from("register").insert([{ 
            name,
            registro,
            cpf,
            celular, 
            email, 
            password 
        }]).select();

        if (error) {
            return reply.status(400).send({ error: error.message });
        }

        return reply.status(201).send({ value: createdRegister ? createdRegister[0] : null });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Erro ao registrar usuário" });
    }
});


// Iniciar o servidor
app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333
}).then(() => {
    console.log('Servidor Funcionando');
}).catch(err => {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
});
