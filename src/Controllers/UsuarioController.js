import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'

class usuarioController {

    constructor(){
        this.login = this.login.bind(this);
    };

    async buscarPorLogin(email, senha) {
        const user = await prisma.usuario.findUnique({ 
            where: { 
                email: email,
                senha: senha,
            },
        })
        
        return user
        
    }

    async login(req, res, next) {
        const {
            email, senha
        } = req.body;

        try {
            // Buscar o usuário
            const user = await this.buscarPorLogin(email, senha);
            const chavePrivada = "mineracaocandidoapi";
    
            // Verifica se o usuário foi encontrado
            if (user) {
                // Determina o papel do usuário
                let role;
                if (user.tipo == "admin") {
                    role = 'admin';
                } else{
                    role = 'usuario';
                }
    
                // Gera o token com o id do usuário e o papel
                const payload = { id: user.id, role };
                jwt.sign(payload, chavePrivada, (err, token) => {
                    if (err) {
                        res.status(500).json({ mensagem: "Erro ao gerar o JWT" });
                        return;
                    }
    
                    // Retorna o token e o papel do usuário
                    res.status(200).json({ token, role });
                });
            } else {
                res.status(401).json({ error: 'Usuário não encontrado' });
            }
        } catch (e) {
            res.status(500).json({ error: 'Erro ao gerar token.' });
        }
    

        // try {
        //     const user = await this.buscarPorLogin(usuario, senha);
        //     const chavePrivada = "FasiclinAPI";

        //     if(user) {
        //         jwt.sign(user, chavePrivada, (err, token) => {
        //             if(err) {
        //                 res.status(500).json({ mensagem: "Erro ao gerar o JWT" });
        //                 return;
        //             }
        //             res.status(200).json({token});
        //         });
        //     }else {
        //         res.status(401).json({error: 'Usuário não encontrado'})
        //     }
        // } catch (e) {
        //     res.status(500).json({error: 'Erro ao gerar token.'});
        // }
    }

    

    //CRUD DO USUÁRIO = CREATE, READ, UPDATE AND DELETE =  CRIANDO, BUSCANDO, ALTERANDO E DELETANDO MEU(S) USUÁRIO(S).

    async getAllUsuarios(req, res) {

        // GET // Buscar todos os usuários.
        const usuarios = await prisma.usuario.findMany();
        return res.json(usuarios);
    }

    async getUsuario(req, res) {

        // GET // Buscar usuário conforme seu ID
        try {
            const { id } = req.params;
            const usuario = await prisma.usuario.findUnique( { where: { id: Number(id) } } )

            if (!usuario) {
                res.status(404).send('Client not found!');
                return; // Pare a execução após o envio da resposta
            }
            
            res.json(usuario)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    async createUsuario(req, res) {
        //CADASTRO DE UM usuario /// CREATE

        try {
            const usuarios = await prisma.usuario.create({ data: req.body });
            res.status(200).json({ success: 'usuario criado com sucesso.', usuario: usuarios });
        } catch (e) {
            if (e.code === 'P2002') {
                // Erro P2002 é o código para violação de unicidade (por exemplo, e-mail já existente)
                res.status(400).json({ error: 'Usuário já existe. Verifique os dados fornecidos.' });
            } else if (e.code === 'P2003') {
                // Erro P2003 é para chave estrangeira inválida
                res.status(400).json({ error: 'Chave estrangeira inválida. Verifique os relacionamentos.' });
            } else {
                // Outros tipos de erros...
                res.status(500).json({ error: `Erro ao criar usuário: Verifique as informações` });
            }
        }
    }

    async alterUsuario(req, res) {
        // Alterar informações de um usuario == UPDATE

        try {
            const { id } = req.params;
            let usuario = await prisma.usuario.findUnique( { where: { id: Number(id) } } )
            if (!usuario) {
                res.status(404).send('Usuário não encontrado!');
                return; // Pare a execução após o envio da resposta
            }

            usuario = await prisma.usuario.update({
                where: { id: Number(id) },
                data: req.body,
            })

            res.json(usuario)

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuario = await prisma.usuario.findUnique( { where: { id: Number(id) } } )

            if (!usuario) {
                res.status(404).send('Usuário não encontrado!');
                return; // Pare a execução após o envio da resposta
            }
            
            await prisma.usuario.delete( { where: { id: Number(id) } })
            
            return res.json({message: "Usuário deletado."})

        } catch (e) {
            res.status(500).send('Server error');
        }
    }

    
}

export { usuarioController };
