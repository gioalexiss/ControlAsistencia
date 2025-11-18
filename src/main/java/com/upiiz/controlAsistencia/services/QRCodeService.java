package com.upiiz.controlAsistencia.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class QRCodeService {

    private static final int QR_CODE_WIDTH = 300;
    private static final int QR_CODE_HEIGHT = 300;

    /**
     * Genera una imagen QR code como array de bytes
     */
    public byte[] generarImagenQR(String contenido) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        BitMatrix bitMatrix = qrCodeWriter.encode(
            contenido,
            BarcodeFormat.QR_CODE,
            QR_CODE_WIDTH,
            QR_CODE_HEIGHT,
            hints
        );

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

        return outputStream.toByteArray();
    }

    /**
     * Genera una imagen QR code como base64 para mostrar en HTML
     */
    public String generarImagenQRBase64(String contenido) throws WriterException, IOException {
        byte[] imageBytes = generarImagenQR(contenido);
        return java.util.Base64.getEncoder().encodeToString(imageBytes);
    }
}
