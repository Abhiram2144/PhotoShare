import { useSocket } from "../contexts/SocketContext";
import { useEffect, useContext, useRef } from "react";
import { toast } from "react-toastify";
import { UserContext } from "../contexts/UserContext";

function GlobalSocketListener() {
    const socket = useSocket();
    const { user } = useContext(UserContext);
    const hasShownToastRef = useRef(false);
    useEffect(() => {
        if (!socket || !user?.id) return;

        const handleAccepted = (newFriend) => {
            if (hasShownToastRef.current) return;
            if (document.visibilityState === "visible"){
            toast.success(`🎉 ${newFriend.username} accepted your friend request!`);
            hasShownToastRef.current = true;
            }
        };

        // Clean up FIRST to prevent stacking duplicates
        socket.off("request_accepted", handleAccepted);
        socket.on("request_accepted", handleAccepted);

        return () => {
            socket.off("request_accepted", handleAccepted);
        };
    }, [socket, user?.id]);

    return null;
}

export default GlobalSocketListener;
