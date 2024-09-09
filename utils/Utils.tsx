import moment from 'moment';

// james pogi

export const isPasswordSecured = (password) => {
  const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~]/.test(password);
  const hasNumeric = /\d/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  
  return hasSpecialChar && hasNumeric && hasLowercase && hasUppercase && password.length >= 8;
};

export const camelCaseToSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, (match) => "_" + match.toLowerCase());
};

export const handleColorCode = (item) => {
  
  switch(item['statusName'].toLowerCase()) {
    case 'completed':
        return 'green'
    case 'complete':
        return 'green'
    case 'complete pass':
        return 'green'
    case 'complete fail':
        return 'red'
    case 'pass but monitor':
        return 'amber'
    case 'no memorial present':
        return 'gray'
    case 'unable to locate plot':
        return '#FFCC00'
    case 'complete':
        return 'green'
    default:
        return '#fff'
  }
}

export const objToCamelCase = (obj: unknown) => {
  const keys = Object.keys(obj);
  response = {};
  
  for(const i in keys) {
    const revisedKey = camelCaseToSnakeCase(keys[i]);
    response[revisedKey] = obj[keys[i]];
  }

  return response;
};

export const toSqlInsert = async (table: string, object: unknown) => {
  const keys = Object.keys(object);

  let sql = "INSERT INTO " + table + " SET ";
  let index = 0;
  for(const i in keys) {
    sql += (index === 0 ? "": ", ") + keys[i] + "=\"" + object[keys[i]] + "\"";
    index++;
  }

  return sql;
};

export const toSqlUpdate = async (table: string, object: unknown, where: string) => {
  const keys = Object.keys(object);

  let sql = "UPDATE " + table + " SET ";
  let index = 0;
  for(const i in keys) {
    sql += (index === 0 ? "": ", ") + keys[i] + "=\"" + object[keys[i]] +"\"";
    index++;
  }

  sql += " WHERE " + where;
  return sql;
};

export const getMysqlDateTime = () => {
  return moment().format('YYYY-MM-DD HH:mm:ss');
};

export const getMysqlTime = () => {
  return moment().format('HH:mm:ss');
};