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
    notificaciones_token: String
    valoracion: Float
    premium: Boolean
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
    notificaciones_token: String
    premium: Boolean
}


type Establecimiento { 
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
    notificaciones_token: String
    premium: Boolean
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
    precio:Int
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
}
input TallasInput {
    camiseta:String 
    short: String 
    calzado:String 
}
input userCliente {
    nombre: String
    apellido:String
    foto:String
    nombreUsuario: String
    sexo:String
    telefono:String
    lugar: Lugar
    fecha_nacimiento: String
}

input  AutenticarClienteInput{
    telefono: String!
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
    registro: String
    precio:Int
}
input UbicacionInput {
    latitude: Float
    longitude: Float
}

type Ubicacion {
 
    longitude: Float!
    latitude:  Float!
  }
type Verificacion {
    code: Int
    message: String
}
type Mutation {

    # usuario
    crearCliente (input: ClienteInput): String
    autenticarCliente(input: AutenticarClienteInput) : AuthPayload!
    verificarCliente(telefono: String, code:Int ) : String!
    enviarCodeVerificacionCliente(telefono: String ) : String
    refreshAccessTokenCliente(refreshToken: String!): AccessToken!
    verificarAutenticacion : Boolean
    restaurarPassword(input: AutenticarClienteInput): String
    editarUsuarioCliente(input: userCliente): User
    editarPeloteroCliente(input: PeloteroInput): User
    editarFotoCliente(foto: String): User
    actualizarTokenNotificacionesCliente(token: String): User
    

    
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
