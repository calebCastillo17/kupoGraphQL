export const AdminTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  
  type EstablecimientoListado{ 
    nombre: String
    id: ID
    disponible: Boolean
    imagen: String
    direccion: String
    notificaciones_token: String
}
 
type  MiEstablecimiento{ 
    nombre: String
    id: ID
    direccion: String
    telefono: String
    numeroCanchas: Int
    horarioApertura: Int!
    horarioCierre: Int!
    servicios: [String]
    imagen: String
    ubicacion: Ubicacion
    disponible: Boolean
    nuevo: String
    notificaciones_token: String
}

type Ubicacion {
 
    longitude: Float!
    latitude:  Float!
  }
type Precio {
    dia: Int
    noche:Int
}

type MiCancha{
    nombre: String
    nombreOpcional: String
    precio: Precio
    id: ID
    inhabilitado:[Int]
    ocupado:[Int]
    imagen: String
}

type Reserva {
    fecha: String
    abono: Int
    id: ID
    espacioAlquilado: String
    cliente: String
    establecimiento: Establecimiento
    registro: String
    estado: String
    nombreUsuario: String
}

type AccessToken {
    token: String
}
type RefreshToken {
    token: String
}

type AuthPayload {
    user: User
    accessToken: AccessToken!
    refreshToken: RefreshToken!
}

type Admin{
    nombre: String
    apellido: String
    email: String
    telefono: String
    code: Int
    message: String
    notificaciones_token: String
}

type  Query {        
    obtenerMisEstablecimientos : [MiEstablecimiento] 
    obtenerMiEstablecimientoSeleccionado(establecimientoId: ID): [MiEstablecimiento]
    obtenerUsuarioAdmin : User
    obtenerMisCanchasPorEstablecimientoFuera(establecimientoId: ID!): [MiCancha] 
    obtenerMisReservas(establecimientoId: ID!): [Reserva]
    encontrarMiEstablecimientoPorId(id:ID!): [MiEstablecimiento]
    obtenerMiHistorialReservas(establecimientoId: ID!, limite: Int, page:Int): [Reserva]

    
    #cliente
    encontrarCliente(clienteId: ID!) : UserPublic
}

input AdminInput {
    nombre: String!
    apellido: String!
    email: String!
    password:String!
    telefono: String
    lugar: Lugar
    fecha_nacimiento: String
    notificaciones_token: String
}
input Lugar {
    pais: String
    nivel_1: String
    nivel_2: String
    nivel_3: String
}
input userAdmin {
    nombre:String
    apellido:String
    foto: String
    nombreUsuario: String
    sexo: String
    telefono: String
    lugar: Lugar
    fecha_nacimiento: String
}


input  AutenticarAdminInput{
    telefono: String!
    password:String!
}


input EstablecimientoInput {
    nombre: String!
    direccion: String!
    telefono: String
    horarioApertura: Int!
    horarioCierre: Int!
    imagen: String
    servicios: [String]
    numeroCanchas: Int
    notificaciones_token: String
}

input EstablecimientoInputEdit {
    nombre: String
    direccion: String
    horarioApertura: Int
    horarioCierre: Int
    imagen: String
    servicios: [String]
    telefono:String
    numeroCanchas: Int
    notificaciones_token: String
}

input UbicacionInput {
    latitude: Float
    longitude: Float
}

input PrecioInput {
    dia:Int
    noche:Int
}

input CanchaInput {
    nombre: String
    nombreOpcional: String
    precio: PrecioInput
    ocupado:[Int]
    inhabilitado:[Int]
    imagen: String
}


type Mutation {
    
    # administradores
    crearAdmin (input: AdminInput): String
    verificarAdmin(telefono: String, code: Int ) : String!
    enviarCodeVerificacionAdmin(telefono: String ) : String
    autenticarAdmin(input: AutenticarAdminInput) : AuthPayload!
    verificarAutenticacion : Boolean
    restaurarPasswordAdmin(input: AutenticarAdminInput): String
    editarUsuario(input: userAdmin): User
    editarFotoAdmin(foto: String): String
    actualizarTokenNotificaciones(token: String): User
    refreshAccessTokenAdmin(refreshToken: String!): AccessToken!
    

    # establecimiento
    nuevoEstablecimiento(input: EstablecimientoInput, ubicacion: UbicacionInput) : MiEstablecimiento
    actualizarEstablecimiento(id : ID!, input: EstablecimientoInputEdit,  disponible: Boolean , ubicacion: UbicacionInput ): MiEstablecimiento
    eliminarEstablecimiento(id:ID!) : String 
    actualizarTokenNotificacionesEstablecimiento(token: String ,establecimientoId: ID): MiEstablecimiento

    #cancha
    nuevaCancha(establecimientoId: String, input: CanchaInput) : MiCancha
    actualizarCancha(id : ID!, input: CanchaInput,  disponible: Boolean): MiCancha
    eliminarCancha( id:ID!) :  String

    # reserva
    eliminarMiReserva(id:ID!, establecimiento: ID!) : String
    actualizarReservaEstado(id:ID!, establecimiento:String, estado: String): Reserva
    nuevaAutoReserva( input: ReservaInput, userId:ID!): Reserva

}

 
`;
