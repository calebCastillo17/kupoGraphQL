export const AdminTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.

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
    precio:Int
}


type  Query {        
    obtenerMiEstablecimiento: MiEstablecimiento
   
    obtenerMisCanchasPorEstablecimientoFuera(establecimientoId: ID!): [MiCancha] 
    obtenerMisReservas(establecimientoId: ID!, cancha: String,fechaMin:String, fechaMax: String): [Reserva]
    obtenerRegistroReservas(establecimientoId: ID!, cancha: String,fechaMin:String, fechaMax: String, estados:[String]): [Reserva]
    obtenerMisNuevasReservas(establecimientoId: ID!): [Reserva]
    obtenerMiHistorialReservas(establecimientoId: ID!, estado: String, limite: Int, page:Int,  fechaMax:String, fechaMin:String,nombreUsuario:String): [Reserva]
    #cliente
    
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
    # establecimiento
    nuevoEstablecimiento(input: EstablecimientoInput, ubicacion: UbicacionInput) : MiEstablecimiento
    actualizarEstablecimiento(id : ID!, input: EstablecimientoInput,  disponible: Boolean , ubicacion: UbicacionInput ): MiEstablecimiento
    eliminarEstablecimiento(id:ID!) : String 
    actualizarTokenNotificacionesEstablecimiento(token: String ,establecimientoId: ID): MiEstablecimiento

    #cancha
    nuevaCancha(establecimientoId: String, input: CanchaInput) : MiCancha
    actualizarCancha(id : ID!, input: CanchaInput,  disponible: Boolean): MiCancha
    eliminarCancha( id:ID!) :  String

    # reserva
    eliminarMiReserva(id:ID!, establecimiento: ID!) : String
    actualizarReserva(id : ID!, input: ReservaInput): Reserva
    actualizarReservaEstado(id:ID!, establecimiento:String, actualizacion:String, estado: String): Reserva
    nuevaAutoReserva( input: ReservaInput, userId:ID!): Reserva

}

 
`;
