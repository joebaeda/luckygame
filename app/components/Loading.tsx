import StirringBalls from "./StirringBalls"

const Loading = () => {
    return (
        <div className="fixed inset-0 flex flex-col space-y-3 items-center justify-center z-10 bg-[#17101f]">
            <StirringBalls />
        </div>
    )
}

export default Loading