import { useEffect } from "react";
import EncryptedStorage from "react-native-encrypted-storage";
import { useRecoilState, useRecoilValue } from "recoil";

import { patientInformationState } from "./atoms";
import { patientInfoKey } from "./constants";

// const hash = require("object-hash");

export default function PatientInformationProvider() {
  const patientInformation = useRecoilValue(patientInformationState);

  //   Regenerate hashes for each patient if data is updated
  //   useEffect(() => {
  //     async function execute() {
  //       let recomputeSummaries = false;
  //       const newPatientInformation: PatientInformation[] = [];
  //       for (let i = 0; i < patientInformation.length; i++) {
  //         const patient = patientInformation[i];
  //         const currentHash = hash.sha1(patient.ingested);
  //         if (currentHash != patient.dataHash) {
  //           recomputeSummaries = true;
  //           newPatientInformation.push({
  //             ...patient,
  //             summary: (
  //               await runLlamaInference(
  //                 "".concat(...patient.ingested.map((data) => data.transcript))
  //               )
  //             ).summary,
  //             dataHash: currentHash
  //           });
  //         }
  //       }
  //       if (recomputeSummaries) {
  //         setPatientInformation(newPatientInformation);
  //       }
  //     }
  //     execute();
  //   }, [patientInformation, setPatientInformation]);

  // Flush changes to patientInformation to storage
  useEffect(() => {
    EncryptedStorage.setItem(
      patientInfoKey,
      JSON.stringify(patientInformation)
    );
  }, [patientInformation]);

  return <></>;
}

export function usePatientInformation() {
  const [patientInformation, setPatientInformation] = useRecoilState(
    patientInformationState
  );

  return {
    patientInformation,
    setPatientInformation
  };
}
