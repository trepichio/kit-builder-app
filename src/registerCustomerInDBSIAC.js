const Firebird = require('node-firebird')
const crypt = require('./revela')
const logger = require('./logger')
const config = require('config')
const canAccess = require('./helpers/canAccess')




// const valuesCONFUSERS = ['TESTE ME', 'FANTASIA', '03386358000192', '123456789', 'RUA ALBERTO BARBETA', 'PEDREGULHO', 'GUARATINGUETA', '12515040', 'SP', '1231522599', '1235133366', 'email1@email.com', '47', 'COMPLEMENTO', 'EDSON', '', '', '', 'C', '']


module.exports = async (data) => {
  const { dbExts, dbNames, dbPath } = config.get('Builder').dbConfig
  var dbOptions = config.util.toObject(config.get('Builder').dbConfig.options)
  // var options = {};

  // options.host = '127.0.0.1';
  // options.port = 3050;
  // options.user = 'SYSDBA';
  // options.database = '';
  // options.password = 'sysdbambd';
  // options.lowercase_keys = false; // set to true to lowercase keys
  // options.role = null;            // default
  // options.pageSize = 4096;        // default when creating database

  for (const extension of dbExts) {
    let databaseFile = `${dbPath}\\${dbNames[data.kitName][0]}${extension}`;
    if (await canAccess(databaseFile)) {
      dbOptions.database = databaseFile;
      console.log("TCL: options.database", dbOptions.database)
      break;
    }
  }


  const { dateCreated } = data

  const opt = { year: 'numeric', month: 'numeric', day: 'numeric' };

  const requestTime = new Date(dateCreated).toLocaleString('pt-br', opt)
  logger.info(`TCL: requestTime ${requestTime}`)

  const { CNPJ, IE, ["RAZAO SOCIAL"]: RAZAO_SOCIAL, CIDADE, UF, FAX, ENDERECO, N, COMPLEMENTO, BAIRRO, CEP, CONTATO, TELEFONE, IM, FANTASIA, IBGE, MUNICIPIO_ID, EMAIL1, EMAIL2, EMAIL3, SUFRAMA } = data.CustomerRegistration


  const valuesCONFUSERS = [RAZAO_SOCIAL, FANTASIA, CNPJ, IE, ENDERECO, BAIRRO, CIDADE, CEP, UF, TELEFONE, FAX, EMAIL1, N, COMPLEMENTO, CONTATO, SUFRAMA, EMAIL2, EMAIL3, IM]

  const cryptValues = valuesCONFUSERS.map(field => crypt(field))

  /*
   *
   *
   * CAMPO001D=RAZAO_SOCIAL
   * CAMPO002D=FANTASIA
   * CAMPO003D=CNPJ
   * CAMPO004D=IE
   * CAMPO005D=ENDERECO
   * CAMPO006D=BAIRRO
   * CAMPO007D=CIDADE
   * CAMPO008D=CEP
   * CAMPO009D=UF
   * CAMPO010D=TELEFONE
   * CAMPO011D=FAX
   * CAMPO012D=EMAIL1
   * CAMPO018D=NUMERO
   * CAMPO019D=COMPLEMENTO
   * CAMPO020D=CONTATO
   * CAMPO026D=SUFRAMA
   * CAMPO027D=EMAIL2
   * CAMPO028D=EMAIL3
   * CAMPO029D=C //removed from query
   * CAMPO031D=IM
   *
   *
   */
  return new Promise((resolve, reject) => {


    Firebird.attach(dbOptions, function (err, db) {

      if (err)
        throw err;

      db.query('SELECT * FROM CONFUSERS', async function (err, result) {
        if (err)
          throw err;
        // IF THERE IS A CUSTOMER ALREADY REGISTERED
        if (result !== undefined && result.length > 0) {

          //WHAT CUSTOMER IS IT?
          for (i = 0; i < result.length; i++) {
            for (const field in result[i]) {
              (result[i][field] === null || typeof result[i][field] === 'number') ? console.log(field, result[i][field]) : console.log(field, result[i][field].toString('latin1'))
            }
          }
          db.detach();
          resolve(true)

        }
        else {
          logger.info("No results");


          try {
            //OK. It's a clean database, let's register the customer info
            logger.info(await new Promise((resv, rej) => {


              // db.query('UPDATE CONFUSERS SET CAMPO001=?, CAMPO002=?, CAMPO003=?, CAMPO004=?, CAMPO005=?, CAMPO006=?, CAMPO007=?, CAMPO008=?, CAMPO009=?, CAMPO010=?, CAMPO011=?, CAMPO012=?, CAMPO018=?, CAMPO019=?, CAMPO020=?, CAMPO026=?, CAMPO027=?, CAMPO028=?, CAMPO031=?', cryptValues, function (err, res) {
              db.query('INSERT INTO CONFUSERS  (CODIGO_ID, CAMPO001, CAMPO002, CAMPO003, CAMPO004, CAMPO005, CAMPO006, CAMPO007, CAMPO008, CAMPO009, CAMPO010, CAMPO011, CAMPO012, CAMPO018, CAMPO019, CAMPO020, CAMPO026, CAMPO027, CAMPO028, CAMPO031) VALUES (1, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', cryptValues, function (err, res) {
                err ? rej(err) : resv(`inserted ${cryptValues.map(v => v ? v.toString('binary') : v)}  @CONFUSERS: `, res);
                // err ? console.log(err) : cryptValues.forEach(v => console.log(`inserted ${ v ? v.toString('binary') : v } @CONFUSERS`));
                // db.detach();
              });
            }))

          } catch (error) {
            console.log(error);
            reject(true)
          }
          finally {
            db.detach();
            resolve(true)
          }

        }

      })

    });
  })
}