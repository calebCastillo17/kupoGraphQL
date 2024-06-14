export const UsuarioTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.


type AccessToken {
    token: String
}
type RefreshToken {
    token: String
}

type AuthResponse {
    user: User
    userType: String
    accessToken: AccessToken
    refreshToken: RefreshToken
    mensaje: String
    opciones: [String]
}

type User {
    nombre: String
    apellido: String 
    foto: String
    nombreUsuario:String
    sexo: String
    telefono: String
    id:ID
    notificaciones_token: String
    lugar: Localidad
    fecha_nacimiento: String
    pelotero: Pelotero
    email:String
}


type Pelotero {
    edad: String  
    posicion: String  
    club: String  
    numero_camiseta: String
    tallas: Tallas
    lesiones: [String] 
    pierna_habil:String 
    peso: String 
    estatura:String 
}

type Tallas {
    camiseta:String 
    short: String 
    calzado:String 
}

type Localidad {
    pais: String
    nivel_1: String
    nivel_2: String
    nivel_3: String
}

type UserPublic {
    nombre: String
    apellido: String
    nombreUsuario:String
    sexo: String
    telefono: String
    notificaciones_token: String
}


type  Query {        
    obtenerUsuario : User
    #cliente
    encontrarUsuario(UsuarioId: ID!) : UserPublic
}

input UsuarioInput {
    nombre: String!
    apellido: String!
    email: String!
    password:String!
    telefono: String!
    nombreUsuario: String!
    lugar: LugarInput
    fecha_nacimiento: String
    notificaciones_token: String
}
input UsuarioInput {
    nombre: String!
    apellido: String!
    email: String!
    password:String!
    telefono: String!
    nombreUsuario: String!
    lugar: LugarInput
    fecha_nacimiento: String
    notificaciones_token: String
}
input UsuarioEditInput {
    nombre: String
    apellido: String
    email: String
    sexo:String
    telefono: String
    nombreUsuario: String
    lugar: LugarInput
    fecha_nacimiento: String
}

input LugarInput {
    pais: String
    nivel_1: String
    nivel_2: String
    nivel_3: String
}
input PeloteroInput {
    edad: String  
    posicion: String  
    club: String  
    numero_camiseta: String
    tallas: TallasInput
    lesiones: [String] 
    pierna_habil:String 
    peso: String 
    estatura:String 
}
input TallasInput {
    camiseta:String 
    short: String 
    calzado:String 
}



input  AutenticarUsuarioInput{
    nombreUsuario: String!
    password:String!
}

type Mutation {
    
    crearUsuario(input: UsuarioInput): String
    verificarNombreUsuario(nombreUsuario:String): String
    verificarUsuario(telefono: String, code: Int ) : String!
    enviarCodeVerificacionUsuario(telefono: String ) : String

    autenticarUsuario(input: AutenticarUsuarioInput, userType: String) : AuthResponse!
    verificarAutenticacion : Boolean
    restaurarPasswordUsuario(input: AutenticarUsuarioInput): String
    editarUsuario(input: UsuarioEditInput): User
    editarFotoUsuario(foto: String): String
    editarPeloteroUsuario(input: PeloteroInput): User
    actualizarTokenNotificaciones(token: String): String
    refreshAccessTokenUsuario(refreshToken: String!): AccessToken!
}

 
`;
