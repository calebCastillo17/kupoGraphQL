export  const ClienteTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  
      
  type Cancha{
    nombre: String
    precio: Precio
    id: ID
    imagen:String
    nombreOpcional: String
    inhabilitado:[Int]
    
}
type Precio{
    dia:Int
    noche: Int
}

type Establecimiento {
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
    notificaciones_token: String
    valoracion: Float
    premium: Boolean
    distancia:Float
    telefono: String
}
  
type Reserva {
    fecha: String
    abono: Int
    id: ID
    espacioAlquilado: String
    cliente: String 
    registro: String
    actualizacion: String
    estado: String
    nombreUsuario: String
    establecimiento: Establecimiento
    precio:Int
}
type Ubicacion {
    longitude: Float!
    latitude:  Float!
  }
type Verificacion {
    code: Int
    message: String
}
type UserPublic {
    nombre: String
    apellido: String
    nombreUsuario:String
    sexo: String
    telefono: String
    notificaciones_token: String
}
type PagoResultado {
    success: Boolean
    message: String
  }

type  Query {
    obtenerEstablecimientos( nombre:String, ubicacion:UbicacionInput, metros: Int,limit:Int, offset: Int, fecha: String) : [Establecimiento]
    obtenerEstablecimientoPorId(establecimientoId: ID) : Establecimiento
    obtenerCanchasPorEstablecimiento(establecimientoId: ID): [Cancha]
    obtenerReservasPorEstab(establecimientoId: ID!,cancha:String, fechaMin:String, fechaMax: String): [Reserva]
    obtenerReservasRealizadas(clienteId: ID! , fecha:String , limite: Int, page:Int): [Reserva]
    obtenerHistorialReservas(clienteId: ID!, limite: Int, page:Int): [Reserva]
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
    registro: String
    precio:Int
}
input UbicacionInput {
    latitude: Float
    longitude: Float
}


type Mutation {

    #Reserva
    actualizarOcupacionCancha(id:ID!, ocupacion: Int ): Cancha
    nuevaReserva( input: ReservaInput, userId:ID!): Reserva
    eliminarReserva (id:ID!, clienteId: ID!) : String
    actualizarReservaEstadoCliente(id:ID!, clienteId :String, estado: String): Reserva
    realizarPagoTarjeta(input: PagoInput!): PagoResultado!

    
}

type Subscription {
    nuevaReservacion(establecimientoId: ID!): Reserva
    cambioEstadoMiReservacion(ClienteId: ID!): Reserva
  }
`;
