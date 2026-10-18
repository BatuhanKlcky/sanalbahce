import java.io.*;
import java.util.zip.*;
import java.nio.file.*;
import java.util.*;

public class UpdateAndSignAab {
    public static void main(String[] args) throws Exception {
        File srcAab = new File("C:/Users/77xTEST/Downloads/sanalbahce-2.2.0.aab");
        File tmpAab = new File("C:/Users/77xTEST/Downloads/sanalbahce-2.2.0-updated.aab");
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

        srcAab.delete();
        tmpAab.renameTo(srcAab);
        System.out.println("AAB updated successfully: " + srcAab.length() + " bytes");
    }
}
