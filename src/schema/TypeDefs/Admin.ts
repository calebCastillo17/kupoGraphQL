export  const AdminTypeDefs = `#graphql
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
    telefonos: [String]
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
    disponible:Boolean
}

type Reserva {
    fecha: String
    abono: Int
    id: ID
    espacioAlquilado: String
    cliente: String
    establecimiento: Establecimiento
    registro: String
    actualizacion: String
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
    obtenerMiEstablecimiento: MiEstablecimiento
    obtenerUsuarioAdmin : User
    obtenerMisCanchasPorEstablecimientoFuera(establecimientoId: ID!): [MiCancha] 
    obtenerMisReservas(establecimientoId: ID!, cancha: String,fechaMin:String, fechaMax: String): [Reserva]
    obtenerRegistroReservas(establecimientoId: ID!, cancha: String,fechaMin:String, fechaMax: String, estados:[String]): [Reserva]
    obtenerMisNuevasReservas(establecimientoId: ID!): [Reserva]
<<<<<<< HEAD
<<<<<<< HEAD
    obtenerMiHistorialReservas(establecimientoId: ID!, estado: String, limite: Int, page:Int, fecha: String): [Reserva]
=======
=======
>>>>>>> parent of d5282ee (Revert "cuarta actualizacion de 1.0.9 - desechable")
    encontrarMiEstablecimientoPorId(id:ID!): [MiEstablecimiento]
    obtenerMiHistorialReservas(establecimientoId: ID!, estado: String, limite: Int, page:Int): [Reserva]

>>>>>>> parent of d5282ee (Revert "cuarta actualizacion de 1.0.9 - desechable")
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
    telefonos: [String]
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
<<<<<<< HEAD
<<<<<<< HEAD
    actualizarReserva(id : ID!, input: ReservaInput): Reserva
    actualizarReservaEstado(id:ID!, establecimiento:String, actualizacion:String, estado: String): Reserva
=======
    actualizarReservaEstado(id:ID!, establecimiento:String, estado: String): Reserva
>>>>>>> parent of d5282ee (Revert "cuarta actualizacion de 1.0.9 - desechable")
=======
    actualizarReservaEstado(id:ID!, establecimiento:String, estado: String): Reserva
>>>>>>> parent of d5282ee (Revert "cuarta actualizacion de 1.0.9 - desechable")
    nuevaAutoReserva( input: ReservaInput, userId:ID!): Reserva

}

 
`;
