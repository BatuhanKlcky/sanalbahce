import java.io.*;
import java.util.zip.*;
import java.nio.file.*;
import java.util.*;
import java.security.*;
import java.security.cert.Certificate;
import jdk.security.jarsigner.JarSigner;

public class UpdateAndSignAab {
    public static void main(String[] args) throws Exception {
        File srcAab = new File("C:/Users/77xTEST/Downloads/sanalbahce-2.2.0.aab");
        File tmpAab = new File("C:/Users/77xTEST/Downloads/sanalbahce-2.2.0-unsigned.aab");
        File signedAab = new File("C:/Users/77xTEST/Downloads/sanalbahce-2.2.0-signed.aab");
        File assetsDir = new File("android/app/src/main/assets/www");

        Map<String, byte[]> newFiles = new HashMap<>();
        Files.walk(assetsDir.toPath()).filter(Files::isRegularFile).forEach(p -> {
            String rel = assetsDir.toPath().relativize(p).toString().replace('\\', '/');
            try {
                newFiles.put("base/assets/www/" + rel, Files.readAllBytes(p));
            } catch (Exception e) { throw new RuntimeException(e); }
        });

        try (ZipFile zipIn = new ZipFile(srcAab);
             ZipOutputStream zipOut = new ZipOutputStream(new FileOutputStream(tmpAab))) {

            Set<String> processed = new HashSet<>();
            Enumeration<? extends ZipEntry> entries = zipIn.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                String name = entry.getName();

                // Strip old signature
                if (name.startsWith("META-INF/") && (name.endsWith(".SF") || name.endsWith(".RSA") || name.endsWith(".MF"))) {
                    continue;
                }

                ZipEntry ze = new ZipEntry(name);
                zipOut.putNextEntry(ze);

                if (newFiles.containsKey(name)) {
                    zipOut.write(newFiles.get(name));
                    processed.add(name);
                } else {
                    try (InputStream is = zipIn.getInputStream(entry)) {
                        is.transferTo(zipOut);
                    }
                }
                zipOut.closeEntry();
            }

            for (Map.Entry<String, byte[]> e : newFiles.entrySet()) {
                if (!processed.contains(e.getKey())) {
                    ZipEntry ze = new ZipEntry(e.getKey());
                    zipOut.putNextEntry(ze);
                    zipOut.write(e.getValue());
                    zipOut.closeEntry();
                }
            }
        }

        // Load keystore and sign
        KeyStore ks = KeyStore.getInstance("JKS");
        try (InputStream fis = new FileInputStream("android/sanalbahce-upload.keystore")) {
            ks.load(fis, "SanalBahce2026!".toCharArray());
        }
        KeyStore.PrivateKeyEntry pKeyEntry = (KeyStore.PrivateKeyEntry) ks.getEntry("upload", new KeyStore.PasswordProtection("SanalBahce2026!".toCharArray()));
        JarSigner signer = new JarSigner.Builder(pKeyEntry).build();

        try (ZipFile inZip = new ZipFile(tmpAab);
             OutputStream out = new FileOutputStream(signedAab)) {
            signer.sign(inZip, out);
        }

        tmpAab.delete();
        srcAab.delete();
        signedAab.renameTo(srcAab);

        // Also copy to android/dist/sanalbahce-2.2.0.aab
        File distAab = new File("android/dist/sanalbahce-2.2.0.aab");
        distAab.getParentFile().mkdirs();
        Files.copy(srcAab.toPath(), distAab.toPath(), StandardCopyOption.REPLACE_EXISTING);

        System.out.println("AAB updated and signed successfully: " + srcAab.length() + " bytes");
    }
}
