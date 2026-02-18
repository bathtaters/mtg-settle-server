import randomSecret from "hat";
const maxCharRange = 0xff; // Latin-1

// Encryption
const limitChar = (a: number, n: number = maxCharRange) => ((a % n) + n) % n; // Keep chars in range
const normalize = (str: string) =>
  str.normalize("NFKD").replace(/[\u0300-\u036F]/g, "");

export const getSecret = () => randomSecret();

export const encryptData = <DataType>(
  data: DataType,
  secret: string = "\x00",
) => {
  const str = normalize(JSON.stringify(data));
  let result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    result[i] = limitChar(
      str.charCodeAt(i) + secret.charCodeAt(i % secret.length),
    );
  }
  return Buffer.from(result).toString("base64");
};

export const decryptData = <DataType>(
  string: string,
  secret: string = "\x00",
) => {
  let result = Buffer.from(string, "base64");
  for (let i = 0; i < result.length; i++) {
    result[i] = limitChar(
      (result[i] ?? 0) - secret.charCodeAt(i % secret.length),
    );
  }
  return JSON.parse(result.toString("utf8")) as DataType;
};
