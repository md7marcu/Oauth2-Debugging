export default interface IUser {
    userId: string;
    password: string;
    email: string;
    name: string;
    code: string;
    nonce: string;
    lastAuthenticated: string;
}