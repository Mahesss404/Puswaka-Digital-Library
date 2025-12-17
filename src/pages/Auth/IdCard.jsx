import React, {useState} from 'react';
import Tesseract from "tesseract.js";
import {FileArchive, FileArchiveIcon, FileUp, FileUpIcon} from "lucide-react";

const IdCard = () => {
    const [image, setImage] = useState(null);
    const [extractedText, setExtractedText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
        }
    };


    const handleExtract = async () => {
        if (!image) {
            alert("Upload ID card terlebih dahulu!");
            return;
        }

        setLoading(true);
        try {
            const result = await Tesseract.recognize(image, "eng");
            const text = result.data.text;
            setExtractedText(text);

            // simple parsing example (you can customize based on your ID format)
            const data = {
                // Name: get the line that is all uppercase letters, but stop before NIS
                name: extractField(
                    text,
                    /^[A-Z\s]+(?=\nNIS)/m
                ),

                // Address: capture lines after "Alamat" up to the first line that doesn't look like part of address
                // key change: capturing group matches content after Alamat, excluding | if present
                address: extractField(
                    text,
                    /Alamat\s*[:.]?\s*([^|\n]+)/i
                ),

                // NIS: digits after "NIS"
                idNumber: extractField(text, /NIS\s*[:.]?\s*(\d+)/i),
            };

            // save to localStorage
            localStorage.setItem("idCardData", JSON.stringify(data));
            console.log("Saved:", data);
        } catch (err) {
            console.error(err);
            alert("Gagal membaca ID Card 😢");
        }
        setLoading(false);
    };

    const extractField = (text, regex) => {
        const match = text.match(regex);
        // If there's a capturing group (match[1]), return that. Otherwise return the whole match.
        if (match) {
            return match[1] ? match[1].trim() : match[0].trim();
        }
        return "Not found";
    };



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-4 text-center">Upload ID Card</h2>

                {/* Upload */}
                <div className="text-center p-12">
                    <p className=" mb-3 text-sm">Choose a file with a size up to 2MB.</p>
                    <input
                        name="fileUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full inline-flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-500 transition cursor-pointer"
                    />
                </div>




                {/* Preview */}
                {image && (
                    <img
                        src={image}
                        alt="Preview"
                        className="rounded-md mb-4 shadow-sm border"
                    />
                )}

                {/* Extract button */}
                <button
                    onClick={handleExtract}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition disabled:bg-gray-300"
                >
                    {loading ? "Processing..." : "Extract Data"}
                </button>

                {/* Extracted Data */}
                {extractedText && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Extracted Data:</h3>
                        <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto">
              {extractedText}
            </pre>
                    </div>
                )}

                {/* Save JSON */}
                {/* <button
                    onClick={handleSaveToDB}
                    className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                >
                    Save JSON to Database
                </button> */}
            </div>
        </div>
    );
};

export default IdCard;