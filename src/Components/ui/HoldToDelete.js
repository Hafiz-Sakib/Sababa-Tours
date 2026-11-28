// src/Components/ui/HoldToDelete.js
// Kept for older imports: a red HoldButton. New code can use <HoldButton tone="confirm | cancel | delete" />.
import HoldButton from "./HoldButton";

const HoldToDelete = (props) => <HoldButton tone="delete" {...props} />;

export default HoldToDelete;
