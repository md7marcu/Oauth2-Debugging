import * as naclUtil from "tweetnacl-util";
import sha256 from "fast-sha256";

export const getRandomSha256 = (randomString: string): string => {
    const encodedString = naclUtil.decodeUTF8(randomString);
    const sha256String = sha256(encodedString);
    const base64String = naclUtil.encodeBase64(sha256String);

    return base64String;
};
export default getRandomSha256;
