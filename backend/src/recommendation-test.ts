/**
 * Prototipo de Similitud de Cosenos
 * 
 * La similitud de cosenos mide el coseno del ángulo entre dos vectores.
 * 
 * Resultado:
 *  1.0 => Coincidencia perfecta de gustos gastronómicos
 *  0.0 => Si  afinidad / Vectores ortogonales
 * -1.0 => Gustos opuestos
*/

import { nodeModuleNameResolver } from "typescript";

function cosineSimilitary(vectorA: number[], vectorB: number[]): number {
	if (vectorA.length !== vectorB.length) {
		throw new Error("Los vectores deben tener la misma dimensión");
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < vectorA.length; i++) {
		dotProduct += vectorA[i] * vectorB[i];
		normA += vectorA[i] ** 2;
		normB += vectorB[i] ** 2;
	}

	if (normA === 0 || normB === 0) return 0; // Previene división por cero

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

