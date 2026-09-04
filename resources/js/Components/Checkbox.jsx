export default function Checkbox({ className = "", ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                "h-5 w-5 rounded-md border-border text-primary shadow-sm " +
                "focus:ring-2 focus:ring-ring focus:ring-offset-2 " +
                className
            }
        />
    );
}
