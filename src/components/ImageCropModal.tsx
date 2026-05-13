import { useState, useRef } from "react";
import {
    View,
    Text,
    Modal,
    Image,
    TouchableOpacity,
    Dimensions,
    PanResponder,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const SCREEN = Dimensions.get("window");

interface CropBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    visible: boolean;
    imageUri: string;
    onDone: (croppedUri: string) => void;
    onCancel: () => void;
}

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

export default function ImageCropModal({ visible, imageUri, onDone, onCancel }: Props) {
    const PREVIEW_W = SCREEN.width - 32;
    const PREVIEW_H = PREVIEW_W; // square preview area

    // Crop box state, relative to the preview image (0-1 normalized)
    const [crop, setCrop] = useState<CropBox>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    const [processing, setProcessing] = useState(false);
    const cropRef = useRef(crop);
    cropRef.current = crop;

    // Track which handle is being dragged: "tl" | "tr" | "bl" | "br" | "body"
    const dragging = useRef<"tl" | "tr" | "bl" | "br" | "body" | null>(null);
    const dragStart = useRef({ pageX: 0, pageY: 0, cropSnapshot: crop });

    function makePanResponder(handle: "tl" | "tr" | "bl" | "br" | "body") {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: (e) => {
                dragging.current = handle;
                dragStart.current = {
                    pageX: e.nativeEvent.pageX,
                    pageY: e.nativeEvent.pageY,
                    cropSnapshot: { ...cropRef.current },
                };
            },
            onPanResponderMove: (e) => {
                const dx = (e.nativeEvent.pageX - dragStart.current.pageX) / PREVIEW_W;
                const dy = (e.nativeEvent.pageY - dragStart.current.pageY) / PREVIEW_H;
                const snap = dragStart.current.cropSnapshot;
                const MIN_SIZE = 0.15;

                setCrop((prev) => {
                    let { x, y, width, height } = snap;

                    if (handle === "body") {
                        x = clamp(snap.x + dx, 0, 1 - snap.width);
                        y = clamp(snap.y + dy, 0, 1 - snap.height);
                    } else if (handle === "tl") {
                        const newX = clamp(snap.x + dx, 0, snap.x + snap.width - MIN_SIZE);
                        const newY = clamp(snap.y + dy, 0, snap.y + snap.height - MIN_SIZE);
                        width = snap.width + (snap.x - newX);
                        height = snap.height + (snap.y - newY);
                        x = newX;
                        y = newY;
                    } else if (handle === "tr") {
                        const newY = clamp(snap.y + dy, 0, snap.y + snap.height - MIN_SIZE);
                        width = clamp(snap.width + dx, MIN_SIZE, 1 - snap.x);
                        height = snap.height + (snap.y - newY);
                        y = newY;
                    } else if (handle === "bl") {
                        const newX = clamp(snap.x + dx, 0, snap.x + snap.width - MIN_SIZE);
                        width = snap.width + (snap.x - newX);
                        height = clamp(snap.height + dy, MIN_SIZE, 1 - snap.y);
                        x = newX;
                    } else if (handle === "br") {
                        width = clamp(snap.width + dx, MIN_SIZE, 1 - snap.x);
                        height = clamp(snap.height + dy, MIN_SIZE, 1 - snap.y);
                    }

                    return { x, y, width, height };
                });
            },
        });
    }

    const panBody = useRef(makePanResponder("body")).current;
    const panTL = useRef(makePanResponder("tl")).current;
    const panTR = useRef(makePanResponder("tr")).current;
    const panBL = useRef(makePanResponder("bl")).current;
    const panBR = useRef(makePanResponder("br")).current;

    const applyCrop = async () => {
        setProcessing(true);
        try {
            // Get natural image size so we can map normalized crop coords to pixels
            const { width: natW, height: natH } =
                await ImageManipulator.ImageManipulator.manipulate(imageUri).renderAsync().then(
                    (r) => r
                ).catch(() => ({ width: 1000, height: 1000 }));

            // Estimate image natural size via Image.getSize
            let imgW = PREVIEW_W;
            let imgH = PREVIEW_H;

            await new Promise<void>((resolve) => {
                Image.getSize(
                    imageUri,
                    (w, h) => { imgW = w; imgH = h; resolve(); },
                    () => resolve()
                );
            });

            const result = await ImageManipulator.ImageManipulator
                .manipulate(imageUri)
                .crop({
                    originX: Math.round(crop.x * imgW),
                    originY: Math.round(crop.y * imgH),
                    width: Math.round(crop.width * imgW),
                    height: Math.round(crop.height * imgH),
                })
                .saveAsync({ compress: 0.9, format: ImageManipulator.SaveFormat.JPEG });

            onDone(result.uri);
        } catch (e) {
            console.error("Crop error:", e);
        } finally {
            setProcessing(false);
        }
    };

    const px = crop.x * PREVIEW_W;
    const py = crop.y * PREVIEW_H;
    const pw = crop.width * PREVIEW_W;
    const ph = crop.height * PREVIEW_H;
    const HANDLE = 22;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <Text style={styles.title}>Crop Photo</Text>
                <Text style={styles.subtitle}>Drag the corners or box to adjust</Text>

                <View style={{ width: PREVIEW_W, height: PREVIEW_H, backgroundColor: "#000" }}>
                    {/* Full image */}
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: PREVIEW_W, height: PREVIEW_H }}
                        resizeMode="contain"
                    />

                    {/* Dark overlay: top */}
                    <View style={[styles.overlay, { top: 0, left: 0, width: PREVIEW_W, height: py }]} />
                    {/* Dark overlay: bottom */}
                    <View style={[styles.overlay, { top: py + ph, left: 0, width: PREVIEW_W, height: PREVIEW_H - py - ph }]} />
                    {/* Dark overlay: left */}
                    <View style={[styles.overlay, { top: py, left: 0, width: px, height: ph }]} />
                    {/* Dark overlay: right */}
                    <View style={[styles.overlay, { top: py, left: px + pw, width: PREVIEW_W - px - pw, height: ph }]} />

                    {/* Crop box border (draggable body) */}
                    <View
                        {...panBody.panHandlers}
                        style={[styles.cropBox, { left: px, top: py, width: pw, height: ph }]}
                    >
                        {/* Grid lines */}
                        <View style={styles.gridH1} />
                        <View style={styles.gridH2} />
                        <View style={styles.gridV1} />
                        <View style={styles.gridV2} />
                    </View>

                    {/* Corner handles */}
                    <View {...panTL.panHandlers} style={[styles.handle, { left: px - HANDLE / 2, top: py - HANDLE / 2 }]} />
                    <View {...panTR.panHandlers} style={[styles.handle, { left: px + pw - HANDLE / 2, top: py - HANDLE / 2 }]} />
                    <View {...panBL.panHandlers} style={[styles.handle, { left: px - HANDLE / 2, top: py + ph - HANDLE / 2 }]} />
                    <View {...panBR.panHandlers} style={[styles.handle, { left: px + pw - HANDLE / 2, top: py + ph - HANDLE / 2 }]} />
                </View>

                {/* Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onCancel} style={styles.btnCancel}>
                        <Text style={styles.btnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={applyCrop}
                        disabled={processing}
                        style={styles.btnCrop}
                    >
                        {processing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnCropText}>✂️ Apply Crop</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Reset */}
                <TouchableOpacity
                    onPress={() => setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })}
                    style={styles.btnReset}
                >
                    <Text style={styles.btnResetText}>Reset</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    title: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 4,
    },
    subtitle: {
        color: "#9CA3AF",
        fontSize: 13,
        marginBottom: 16,
    },
    overlay: {
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    cropBox: {
        position: "absolute",
        borderWidth: 2,
        borderColor: "#fff",
    },
    handle: {
        position: "absolute",
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#DC2626",
        borderWidth: 2,
        borderColor: "#fff",
    },
    gridH1: {
        position: "absolute",
        top: "33%",
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    gridH2: {
        position: "absolute",
        top: "66%",
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    gridV1: {
        position: "absolute",
        left: "33%",
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    gridV2: {
        position: "absolute",
        left: "66%",
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    actions: {
        flexDirection: "row",
        marginTop: 20,
        gap: 12,
    },
    btnCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#4B5563",
        alignItems: "center",
    },
    btnCancelText: {
        color: "#9CA3AF",
        fontWeight: "600",
    },
    btnCrop: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#DC2626",
        alignItems: "center",
    },
    btnCropText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    btnReset: {
        marginTop: 12,
    },
    btnResetText: {
        color: "#6B7280",
        fontSize: 13,
        textDecorationLine: "underline",
    },
});
