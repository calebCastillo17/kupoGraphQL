export  const ImperiotTypeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  
  scalar FileUpload
    type Cliente {
        nombre: String
        apellido:String
        email: String
        id: ID

    }
    type Admin {
        nombre: String
        apellido:String
        email: String
        id: ID

    }
    type Establecimiento {
        id: ID 
        nombre: String
        creador: String
        numeroCanchas: Int
        disponible:Boolean
    }
    type Token{
        token: String
    }
    type  Query {
        obtenerClientes(input: UsuarioBusquedaInput, offset:Int, limit:Int): [User]
        obtenerAdmins: [Admin]
    }

    input UsuarioBusquedaInput {
        nombre: String
        apellido: String
        nombreUsuario:String
    }

    input ImperiotInput {
        nombre: String!
        apellido: String!
        email: String!
        password:String!
    }

    input  AutenticarInput{
        email: String!
        password:String!
    }

    type Mutation {
        # imperiots
        crearImperiot (input: ImperiotInput): String
        autenticarImperiot(input: AutenticarInput) : Token
        singleUpload(file:String): String
    }
    
 
`;
