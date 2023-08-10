export const AdminTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  
  type EstablecimientoListado{ 
    nombre: String
    id: ID
    disponible: Boolean
    descripcion: String
    imagen: String
    direccion: String
}
 
type  MiEstablecimiento{ 
    nombre: String
    id: ID
    descripcion: String
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
}

type Ubicacion {
 
    longitude: Float!
    latitude:  Float!
  }
 

type MiCancha{
    nombre: String
    nombreOpcional: String
    precio: Int
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

type User {
    nombre:String
    apellido:String
    nombreUsuario: String
    sexo: String
    telefono: String
    id:ID
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
    code: Int
    message: String
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
    encontrarCliente(nombreUsuario: String) : UserPublic
}

input AdminInput {
    nombre: String!
    apellido: String!
    email: String!
    password:String!
}

input userAdmin {
    nombre:String
    apellido:String
    nombreUsuario: String
    sexo: String
}


input  AutenticarInput{
    email: String!
    password:String!
}

input EstablecimientoInput {
    nombre: String!
    descripcion: String!
    direccion: String!
    telefono: String
    horarioApertura: Int!
    horarioCierre: Int!
    imagen: String
    servicios: [String]
    numeroCanchas: Int
}

input EstablecimientoInputEdit {
    nombre: String
    descripcion: String
    direccion: String
    horarioApertura: Int
    horarioCierre: Int
    imagen: String
    servicios: [String]
    telefono:String
    numeroCanchas: Int

}

input UbicacionInput {
    latitude: Float
    longitude: Float
}



input CanchaInput {
    nombre: String
    nombreOpcional: String
    precio: Int
    ocupado:[Int]
    inhabilitado:[Int]
    imagen: String

}


type Mutation {
    
    # administradores
    crearAdmin (input: AdminInput): String
    verificarAdmin(input: AdminInput) : Admin
    autenticarAdmin(input: AutenticarInput) : AuthPayload!
    verificarAutenticacion : Boolean
    editarUsuario(input: userAdmin): User
    refreshAccessTokenAdmin(refreshToken: String!): AccessToken!
    

    # establecimiento
    nuevoEstablecimiento(input: EstablecimientoInput, ubicacion: UbicacionInput) : MiEstablecimiento
    actualizarEstablecimiento(id : ID!, input: EstablecimientoInputEdit,  disponible: Boolean , ubicacion: UbicacionInput ): MiEstablecimiento
    eliminarEstablecimiento(id:ID!) : String 

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
