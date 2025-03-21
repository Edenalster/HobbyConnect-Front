import { motion } from "framer-motion";
import "../index.css"; // Make sure this path is correct

export default function Loading() {
  return (
    <motion.div
      className="loader" // Use the CSS spinner class
      animate={{ rotate: 360 }} // Ensure rotation effect
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }} // Smooth animation
    />
  );
}
