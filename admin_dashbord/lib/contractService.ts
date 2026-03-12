// import { 
//   collection, 
//   addDoc, 
//   getDocs, 
//   query, 
//   where, 
//   orderBy, 
//   limit, 
//   startAfter, 
//   Timestamp,
//   doc,
//   updateDoc,
//   getDoc,
//   QueryDocumentSnapshot,
//   DocumentData
// } from "firebase/firestore";
// import { db } from "@/app/config/firebase";

// export interface ContractMessage {
//   id?: string;
//   userId: string;
//   userEmail: string;
//   subject: string;
//   message: string;
//   status: "pending" | "in-progress" | "resolved" | "closed";
//   createdAt: Timestamp;
//   updatedAt: Timestamp;
//   responses?: ContractResponse[];
// }

// export interface ContractResponse {
//   id?: string;
//   message: string;
//   respondedBy: string;
//   respondedByEmail: string;
//   isAdmin: boolean;
//   createdAt: Timestamp;
// }

// // Create a new contract message
// export const createContract = async (data: {
//   userId: string;
//   userEmail: string;
//   subject: string;
//   message: string;
// }): Promise<string> => {
//   try {
//     const contractData: Omit<ContractMessage, "id"> = {
//       ...data,
//       status: "pending",
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now(),
//       responses: [],
//     };

//     const docRef = await addDoc(collection(db, "contracts"), contractData);
//     return docRef.id;
//   } catch (error) {
//     console.error("Error creating contract:", error);
//     throw error;
//   }
// };

// // Add a response to a contract
// export const addContractResponse = async (
//   contractId: string,
//   response: {
//     message: string;
//     respondedBy: string;
//     respondedByEmail: string;
//     isAdmin: boolean;
//   }
// ): Promise<void> => {
//   try {
//     const contractRef = doc(db, "contracts", contractId);
//     const contractSnap = await getDoc(contractRef);

//     if (!contractSnap.exists()) {
//       throw new Error("Contract not found");
//     }

//     const currentData = contractSnap.data() as ContractMessage;
//     const newResponse: ContractResponse = {
//       ...response,
//       createdAt: Timestamp.now(),
//     };

//     const updatedResponses = [...(currentData.responses || []), newResponse];

//     await updateDoc(contractRef, {
//       responses: updatedResponses,
//       updatedAt: Timestamp.now(),
//       status: response.isAdmin ? "in-progress" : currentData.status,
//     });
//   } catch (error) {
//     console.error("Error adding response:", error);
//     throw error;
//   }
// };

// // Update contract status
// export const updateContractStatus = async (
//   contractId: string,
//   status: ContractMessage["status"]
// ): Promise<void> => {
//   try {
//     const contractRef = doc(db, "contracts", contractId);
//     await updateDoc(contractRef, {
//       status,
//       updatedAt: Timestamp.now(),
//     });
//   } catch (error) {
//     console.error("Error updating status:", error);
//     throw error;
//   }
// };

// // Get contracts with pagination (for users)
// export const getUserContracts = async (
//   userEmail: string,
//   pageSize: number = 10,
//   lastDoc?: QueryDocumentSnapshot<DocumentData>
// ): Promise<{
//   contracts: ContractMessage[];
//   lastDoc: QueryDocumentSnapshot<DocumentData> | null;
//   hasMore: boolean;
// }> => {
//   try {
//     // Simple query without orderBy to avoid index requirement
//     let q = query(
//       collection(db, "contracts"),
//       where("userEmail", "==", userEmail),
//       limit(pageSize + 1)
//     );

//     if (lastDoc) {
//       q = query(q, startAfter(lastDoc));
//     }

//     const querySnapshot = await getDocs(q);
//     const contracts: ContractMessage[] = [];
    
//     querySnapshot.docs.forEach((doc) => {
//       contracts.push({ id: doc.id, ...doc.data() } as ContractMessage);
//     });

//     // Sort in memory after fetching
//     contracts.sort((a, b) => {
//       const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
//       const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
//       return timeB - timeA; // Descending order
//     });

//     const hasMore = contracts.length > pageSize;
//     if (hasMore) {
//       contracts.pop();
//     }

//     return {
//       contracts,
//       lastDoc: querySnapshot.docs[querySnapshot.docs.length - (hasMore ? 2 : 1)] || null,
//       hasMore,
//     };
//   } catch (error) {
//     console.error("Error getting user contracts:", error);
//     throw error;
//   }
// };

// // Get all contracts with pagination (for admin)
// export const getAllContracts = async (
//   pageSize: number = 10,
//   lastDoc?: QueryDocumentSnapshot<DocumentData>,
//   statusFilter?: ContractMessage["status"]
// ): Promise<{
//   contracts: ContractMessage[];
//   lastDoc: QueryDocumentSnapshot<DocumentData> | null;
//   hasMore: boolean;
// }> => {
//   try {
//     let q = query(
//       collection(db, "contracts"),
//       limit(pageSize + 1)
//     );

//     if (statusFilter) {
//       q = query(
//         collection(db, "contracts"),
//         where("status", "==", statusFilter),
//         limit(pageSize + 1)
//       );
//     }

//     if (lastDoc) {
//       q = query(q, startAfter(lastDoc));
//     }

//     const querySnapshot = await getDocs(q);
//     const contracts: ContractMessage[] = [];
    
//     querySnapshot.docs.forEach((doc) => {
//       contracts.push({ id: doc.id, ...doc.data() } as ContractMessage);
//     });

//     // Sort in memory after fetching
//     contracts.sort((a, b) => {
//       const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
//       const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
//       return timeB - timeA; // Descending order
//     });

//     const hasMore = contracts.length > pageSize;
//     if (hasMore) {
//       contracts.pop();
//     }

//     return {
//       contracts,
//       lastDoc: querySnapshot.docs[querySnapshot.docs.length - (hasMore ? 2 : 1)] || null,
//       hasMore,
//     };
//   } catch (error) {
//     console.error("Error getting all contracts:", error);
//     throw error;
//   }
// };

// // Get a single contract by ID
// export const getContractById = async (contractId: string): Promise<ContractMessage | null> => {
//   try {
//     const contractRef = doc(db, "contracts", contractId);
//     const contractSnap = await getDoc(contractRef);

//     if (!contractSnap.exists()) {
//       return null;
//     }

//     return { id: contractSnap.id, ...contractSnap.data() } as ContractMessage;
//   } catch (error) {
//     console.error("Error getting contract:", error);
//     throw error;
//   }
// };

// // Search contracts by email (for admin)
// export const searchContractsByEmail = async (
//   email: string,
//   pageSize: number = 10
// ): Promise<ContractMessage[]> => {
//   try {
//     const q = query(
//       collection(db, "contracts"),
//       where("userEmail", "==", email),
//       limit(pageSize)
//     );

//     const querySnapshot = await getDocs(q);
//     const contracts: ContractMessage[] = [];
    
//     querySnapshot.docs.forEach((doc) => {
//       contracts.push({ id: doc.id, ...doc.data() } as ContractMessage);
//     });

//     // Sort in memory after fetching
//     contracts.sort((a, b) => {
//       const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
//       const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
//       return timeB - timeA; // Descending order
//     });

//     return contracts;
//   } catch (error) {
//     console.error("Error searching contracts:", error);
//     throw error;
//   }
// };
