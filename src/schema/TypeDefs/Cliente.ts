export  const ClienteTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  
      
  type Cancha{
    nombre: String
    precio: Int
    id: ID
    imagen:String
    nombreOpcional: String
    inhabilitado:[Int]
    
}
type EstablecimientoLista {
    nombre: String
    id: ID
    direccion: String
    numeroCanchas: Int
    servicios: [String]
    imagen: String
    disponible: Boolean
    ubicacion:Ubicacion
    horarioApertura: Int!
    horarioCierre: Int!
    reservas: [Reserva]
}
type EstablecimientoAltoque {
    nombre: String
    id: ID
    direccion: String
    numeroCanchas: Int
    servicios: [String]
    imagen: String
    disponible: Boolean
    ubicacion:Ubicacion
    horarioApertura: Int!
    horarioCierre: Int!
    reservas: Reserva
}


type Establecimiento { 
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
}


  
type Reserva {
    fecha: String
    abono: Int
    id: ID
    espacioAlquilado: String
    cliente: String 
    registro: String
    estado: String
    nombreUsuario: String
    establecimiento: Establecimiento
}


type AccessToken{
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

type User {
    nombre: String
    apellido: String
    nombreUsuario:String
    sexo: String
    telefono: String
    id:ID
}
type UserPublic {
    nombre: String
    apellido: String
    nombreUsuario:String
    sexo: String
    telefono: String
}

type PagoResultado {
    success: Boolean
    message: String
  }

type  Query {
    obtenerEstablecimientosFilter(ubicacion:UbicacionInput, metros: Int, nombre:String, limit:Int, offset: Int ) : [EstablecimientoLista]
    obtenerEstablecimientoPorId(establecimientoId: ID) : Establecimiento
    obtenerEstablecimientosDisponibles(fecha: String, offset: Int!, limit: Int!,ubicacion:UbicacionInput,metros: Int): [EstablecimientoLista]
    obtenerCanchasPorEstablecimiento(establecimientoId: ID): [Cancha]
    obtenerReservasPorEstab(establecimientoId: ID!, fechaMin:String, fechaMax: String): [Reserva]
    obtenerReservasRealizadas(clienteId: ID!): [Reserva]
    obtenerHistorialReservas(clienteId: ID!, limite: Int, page:Int): [Reserva]
}

input  ProyectoIDProyecto {
    proyecto:String!

}

input ClienteInput {
    nombre: String!
    apellido: String!
    email: String!
    password:String!
}

input userCliente {
    nombre: String
    apellido:String
    nombreUsuario: String
    sexo:String
    telefono:String
}

input  AutenticarInput{
    email: String!
    password:String!
}

input PagoInput {
    
    token: String
    issuer_id: String
    payment_method_id: String
    installments: String
    email: String
    amount: String
    orden: Orden
  }

input Orden {
    user_id: String
    establecimiento_id: String
}

input ReservaInput {
    establecimiento: ID!
    espacioAlquilado:String!
    fecha:String
    abono: Int
    nombreUsuario: String
    estado: String
}
input UbicacionInput {
    latitude: Float
    longitude: Float
}


type Ubicacion {
 
    longitude: Float!
    latitude:  Float!
  }
type Mutation {

    # usuario
    crearCliente (input: ClienteInput): String
    autenticarCliente(input: AutenticarInput) : AuthPayload!
    refreshAccessTokenCliente(refreshToken: String!): AccessToken!
    verificarAutenticacion : Boolean
    editarUsuarioCliente(input: userCliente): User
    

    
    #Reserva
    actualizarOcupacionCancha(id:ID!, ocupacion: Int ): Cancha
    nuevaReserva( input: ReservaInput, userId:ID!): Reserva
    eliminarReserva (id:ID!, clienteId: ID!) : String
    actualizarReservaEstadoCliente(id:ID!, clienteId :String, estado: String): Reserva


    realizarPagoTarjeta(input: PagoInput!): PagoResultado!

    
}

type Subscription {
    nuevaReservacion(establecimientoId: ID!): Reserva
  }
`;
