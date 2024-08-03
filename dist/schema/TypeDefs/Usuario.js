export const UsuarioTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  
  scalar FileUpload


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
        apodo: String  
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
    
    type  Query {
        obtenerUsuarioAdmin : User
        encontrarCliente(clienteId: ID!) : UserPublic
    }

    input  AutenticarUsuarioInput{
        nombreUsuario: String!
        password:String!
    }

    input UserRegisterInput {
        nombre: String!
        apellido: String!
        nombreUsuario: String
        email: String!
        telefono: String
        password:String!
        lugar: Lugar
        fecha_nacimiento: String
    }
      
    input Lugar {
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
        apodo:String
    }
    input TallasInput {
        camiseta:String 
        short: String 
        calzado:String 
    }
    input userInput {
        nombre: String
        apellido:String
        foto:String
        nombreUsuario: String
        sexo:String
        email:String
        lugar: Lugar
        fecha_nacimiento: String
    }
  
    type Mutation {
        autenticarUsuario(input: AutenticarUsuarioInput, userType: String) : AuthResponse!
        verificarAutenticacion : Boolean
        verificarNombreUsuario(nombreUsuario: String): String!
        # administradores
        crearAdmin (input: UserRegisterInput): String
        verificarAdmin(email: String, code: Int ) : String!
        enviarCodeVerificacionAdmin(email: String ) : String
        restaurarPasswordAdmin(input: AutenticarUsuarioInput): String
        editarUsuario(input: userInput): User
        editarFotoAdmin(foto: String): String
        actualizarTokenNotificaciones(token: String): User
        refreshAccessTokenAdmin(refreshToken: String!): AccessToken!

        # usuario
        crearCliente (input: UserRegisterInput): String
        verificarCliente(email: String, code:Int ) : String!
        enviarCodeVerificacionCliente(email: String ) : String
        refreshAccessTokenCliente(refreshToken: String!): AccessToken!
        restaurarPassword(input: AutenticarUsuarioInput): String
        editarUsuarioCliente(input: userInput): User
        editarPeloteroCliente(input: PeloteroInput): User
        editarFotoCliente(foto: String): User
        actualizarTokenNotificacionesCliente(token: String): User

    }
`;
