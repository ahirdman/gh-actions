rm -rf build/fingerprint/index.js
rm -rf build/comment/index.js
bunx ncc build src/fingerprint/index.ts -o build/fingerprint
bunx ncc build src/comment/index.ts -o build/comment
