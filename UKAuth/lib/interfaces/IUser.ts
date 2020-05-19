export default interface IUser {
    userId?: string;
    password: string;
    email: string;
    name: string;
    tokens?: string[];
    code?: string;
    nonce?: string;
    lastAuthenticated?: string;
}