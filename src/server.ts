import fastify from "fastify";
import { supabase } from "./supabaseConnection";

const app = fastify();

type Users = {
    name: string
    email: string
    password: string
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
        const { name, email, password } = request.body as Users;

        const { data: createdUser, error } = await supabase.from("users").insert([{ 
            name, 
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
