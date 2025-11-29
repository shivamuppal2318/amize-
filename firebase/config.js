import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

export const firebaseConfig = {
  type: "service_account",
  project_id: "amize-34007",
  private_key_id: "d90253408bce47e47be781e5e38b97c0b7f29fc0",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDjvb3SiIGPiflV\n4nlaGlGgWdbrz4jlmFHEr7lmGXc2RJvsGP+IjgWxC4ise6h9FlDmHd3ipJDOWqag\nM0xLpOx1bWoZHnhfslG9A/sUlx8L4mKz90hTuvxhTCXviYX0gIbm1DbvKmQOheZ+\nZJPTtj/cJYHyKBYdyUEiUlSjj+SviEfaWFRxA3igAh3nIdmKxpYjMJ+Pzh/wevFu\n5AKS7y7DMcMsOgsquIZFdjznIQa3zB6RkihG7hQgd05v/ddjWzMPZ7b94hHmjnSF\ndoXJTPeoS5F4azLmEqLZ4qYoL9bfbYoRQSm0/im84itK85ttCqJv6NWccw53nnSM\nLk8MUkalAgMBAAECggEARiHqUOlErMVaiT5DDKJKPM0tyFSS3dF4bM+Iko6JDac3\nNQ/FsXG7AviAUE2MZ2j15MeRyvfOuB1mbrMdbbYOM2NMZwvhGec6ELEnIwIex3Qh\n3TXrig1tJzFiBVAedlsWMANuH1y4j1hg0M98TpgzNkI+sCn0FZwieMVN10i6rer/\nKpcZU5h8JgOEVKNI81xiIkgOSJAS0XKQtKF5f+TM0sQ+V0JDkQKWil6vtnOYvxVQ\nx72jABZ3gGHLIs89dtQf9tloSxWRJ0MqwqGKB36xG9DAVfZh8mCp6hkfMWRQKcfT\nquCDTDYA9rVRiEfWMsNC+UXMWBqLAC5i09l6Wez4yQKBgQD09RjsaQLKiU0EE2dI\nFxBW/UIFE1ouwpZSvWMzyHVPV5LfFbkVxALrNdp++F1TZ3AjOgFJMqK6ZO58f+19\nd36JP5DyzY1+WJjXFEJa1s7+XT1JDMwLhvPhWngNZggDemS5Do3574PVQZdN2ORa\ns1yk+mOsR5Nj1cgm5HDGhgVupwKBgQDuAfZRpZkgXs+OePAANJoX5MgcfsHIUM8N\n3wNbEJ4xN0vEgneWQDJz9HkjKp53/gKiJ/fV2TDlTYR2cvBBfW9wah3cj/LM+tB5\na6tk9A5Ki0rPznNkp10cB9Aoi1BSD8TViu4Q8E9QfVgA0LHJbpgGE+pQJcb+ZFMh\n0Hq1XAS10wKBgDtRNs3YyAI/qVS5ViNQ4nYOMfSEsSvtlvVGQ0WA31dtP3WiDwXE\nR2ipy9U/U2ok/DSrkTAmgN1eH5oqaFofm5aku/bv67mSvsAmecMBjXJvJa4Q2UBZ\nV6lUfQnRkVM2Sjm92oeRhn0Xuwnw4atND7wrngNT+c8NL8CrRNvuDFa1AoGAaaql\nWQpUOXLeYzp+ExlHcGQ6E6yTDAQUaOwh6UQvd1o9YTkrLqHBxIk9XseFI3C6apOk\nDGUouCT6MjxFPk4aM6ZpK4sdGLQh6kZLCb7wuVeuFyRpRr6nL9KoL9fqCQTHNqc/\nmnWWQP3lHDeLNwrKo6gj1wFun3KbFeAhGnOIA9ECgYEA6wfy0/ctAul2l/wt+WW4\nAkXos7ApnK8btKN3qPtlU56T1LJSosHJeLCveim4DreO8yS1vKSo2xKRGw4PxlN0\nXko0vuMmOufpfm88R6/YBjHaoGyCEZkL0t2IqsIwJNrTJxIfCZnIZCsMRstARGjH\nRva4sfKT2gCCru/xeKD9QWQ=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@amize-34007.iam.gserviceaccount.com",
  client_id: "106827416232621817837",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40amize-34007.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export default firebaseApp;
