import jwt from 'jsonwebtoken'

export default function auth(roles) {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];
        const chavePrivada = "mineracaocandidoapi"; // Use uma variável de ambiente para segurança

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        jwt.verify(token, chavePrivada, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Token inválido' });
            }

            // Verifica se o `role` do token está entre os permitidos
            if (!roles.includes(decoded.role)) {
                return res.status(403).json({ error: 'Acesso não autorizado' });
            }

            // Anexa os dados decodificados do token à requisição
            req.user = decoded;
            next();
        });
    };
}