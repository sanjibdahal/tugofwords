import { Variants } from "framer-motion";

export const floatVariants: Variants = {
    float: {
        y: [0, -10, 0],
        rotate: [0, -5, 5, 0],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
    hover: { scale: 1.1, y: -5, transition: { duration: 0.3 } },
};