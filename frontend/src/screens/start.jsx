const CreateOrJoin = ({ onCreate, onJoin }) => {
    return (
        <div className="ScreenCenterContainer">
            <img src="/create.svg" className="Button" onClick={onCreate} alt="Create" />
            <img src="/join.svg" className="Button" onClick={onJoin} alt="Join" />
        </div>
    );
};

export default CreateOrJoin;
