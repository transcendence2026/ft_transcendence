//Payload o carga util mínima contiene los datos esenciales del usuario
//que viajan dentro del token y en la sesión
export interface UserPayload {
	id: string; //identificador únicols
	username: string; //el nombre visible que se vera en los chats o posts
	email: string; //mail usuario
	roles: string[]; //lista de permisos (por defecto de 'USER', 'ADMIN' en otro caso)
}