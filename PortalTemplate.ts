import * as modlib from 'modlib'

// SCOREBOARD VALUES
const ScoreboardType = mod.ScoreboardType.CustomTwoTeams;
const ScoreboardTeam1Header = mod.stringkeys.NatoScore + mod.GetGameModeScore(mod.GetTeam(1)) + mod.GetTargetScore();
const ScoreboardTeam2Header = mod.stringkeys.PaxScore + mod.GetGameModeScore(mod.GetTeam(2)) + mod.GetTargetScore();
const ScoreboardSortingColumn = 0;
const ScoreboardReverseSorting = false;

const KillScoreMultiplier = 100;
const AssistScoreMultiplier = 50;
const FlagCaptureScoreMultiplier = 200;

// COMMON VALUES
const FriendlyColour = mod.CreateVector(0, 0.8, 1);
const EnemyColour = mod.CreateVector(1, 0, 0);

// CLASSES
class GameController {
    CurrentMap: Map;
    PlayerController: PlayerController;
    Scoreboard: Scoreboard;

    constructor() {        
        this.CurrentMap = this.SetupMap()        
        this.PlayerController = new PlayerController();
        this.Scoreboard = new Scoreboard(ScoreboardType, ScoreboardTeam1Header, ScoreboardTeam2Header, ScoreboardSortingColumn, ScoreboardReverseSorting);
    }   

    Setup() {
        this.Scoreboard.Setup();
        mod.SetGameModeTargetScore(5);
    }    

    SetupMap(): Map {
        // To Idnetify map since mod.IsCurrentMap() is broken, instead place a saptial object in map, give it ID and get the X component of it's position
        // Each map should have this spatial object at a diffrent value of X to identify it.             
        let mapID = mod.XComponentOf(mod.GetObjectPosition(mod.GetSpatialObject(1111)));
        switch (mapID) {
            case 10:
                return Map_Firestorm;
        }

        // Default return       
        return Map_Firestorm;
    }    

    SetupPlayer(player: mod.Player) {
        this.PlayerController.SetupPlayer(player);        
    }

    // informType: Type of notification to display | team: Team to display the message to (if required)
    InformPlayers(informType: number, team: mod.Team | null) {        
        const allPlayers = this.PlayerController.PlayerList;

        for (let i = 0; i < allPlayers.length; i++) {          
            const player = allPlayers[i];

            // Use value of informType to determine what message to display
            switch (informType) {                
                case 1:
                    player.PlayerUIController.InformGameStart();
                    break;
            }
        }
    }    

    UpdateGameModeUI() {
        const allPlayers = this.PlayerController.PlayerList;

        for (let i = 0; i < allPlayers.length; i++) {
            const player = allPlayers[i];
            player.PlayerUIController.UpdateGameModeUI();
        }
    }
}

class Map {    
    CapturePoints: CapturePoint[];    

    constructor(_capturePoints: CapturePoint[]) {        
        this.CapturePoints = _capturePoints;        
    }

    GetCapturePoint(capturePointID: number): CapturePoint | null {
        for (let i = 0; i < this.CapturePoints.length; i++) {
            const capturePoint = this.CapturePoints[i];
            if (capturePoint.ID == capturePointID) {                
                return capturePoint;
            }
        }
        
        return null;
    }
}

class Scoreboard {
    Type: mod.ScoreboardType;
    HeaderTeam1: string;
    HeaderTeam2: string;     
    SortingColumn: number;
    ReverseSorting: boolean;        

    constructor(_type: mod.ScoreboardType, _headerTeam1: string, _headerTeam2: string, _sortingColumn: number, _reverseSorting: boolean) {
        this.Type = _type;
        this.HeaderTeam1 = _headerTeam1;
        this.HeaderTeam2 = _headerTeam2;
        this.SortingColumn = _sortingColumn;
        this.ReverseSorting = _reverseSorting;
    }

    Setup() {
        mod.SetScoreboardType(this.Type);
        mod.SetScoreboardHeader(mod.Message(this.HeaderTeam1), mod.Message(this.HeaderTeam2));
        mod.SetScoreboardSorting(this.SortingColumn, this.ReverseSorting);
        mod.SetScoreboardColumnNames(mod.Message("Score"), mod.Message("Eliminations"), mod.Message("Deaths"));
    }    
}

class PlayerController {
    PlayerList: Player[];
    PlayerIdCount: number;
    RemovePlayerList: Player[];

    constructor() {        
        this.PlayerList = [];
        this.PlayerIdCount = 0;
        this.RemovePlayerList = [];
    }  

    SetupPlayer(_player: mod.Player) {
        const player = new Player(this.PlayerIdCount, _player)
        this.PlayerList.push(player);                        
        player.PlayerUIController.Setup()
        this.PlayerIdCount++;               
    }

    GetPlayer(_player: mod.Player): Player {        
        for (let i = 0; i < this.PlayerList.length; i++) {
            const player = this.PlayerList[i];
            if (mod.Equals(player.Player, _player)) {
                return player;
            }
        }        
        
        return this.PlayerList[0];
    }    

    GetPlayerById(playerID: number): Player | undefined {
        return this.PlayerList.find(player => player.ID == playerID);           
    }
}

class Player {
    ID: number;
    Player: mod.Player;
    PlayerUIController: PlayerUIController;
    Stats: PlayerStats;

    constructor(_id: number, _player: mod.Player) {
        this.ID = _id;
        this.Player = _player;
        this.PlayerUIController = new PlayerUIController(this.ID, this.Player);
        this.Stats = new PlayerStats(_player);
    }
}

class PlayerStats {
    Player: mod.Player;
    Score: number;
    Kills: number;
    Assists: number;
    Deaths: number;
    FlagCaptures: number;   

    constructor(_player: mod.Player) {
        this.Player = _player;
        this.Score = 0;
        this.Kills = 0;
        this.Assists = 0;
        this.Deaths = 0;
        this.FlagCaptures = 0;        
    }

    AddKill() {        
        this.Kills++;
    }

    AddDeath() {        
        this.Deaths++;
    }

    AddAssist() {        
        this.Assists++;
    }

    AddFlagCapture() {        
        this.FlagCaptures++;
    }   

    CalculateScore() {
        this.Score = (this.Kills * KillScoreMultiplier) + (this.Assists * AssistScoreMultiplier) + (this.FlagCaptures * FlagCaptureScoreMultiplier);        
    }

    UpdateScore() {        
        this.CalculateScore();
        mod.SetScoreboardPlayerValues(this.Player, this.Score, this.Kills + this.Assists, this.Deaths);
    }
}

class PlayerUIController {
    ID: number;
    Player: mod.Player;
    PlayerTeam: mod.Team;
    CapturePointUIList: CapturePointUI[];
    GameModeUI: GameModeUI;
    ObjectiveUI: ObjectiveUI;    

    constructor(_id: number, _player: mod.Player) {        
        this.ID = _id;
        this.Player = _player;
        this.PlayerTeam = mod.GetTeam(_player);
        this.CapturePointUIList = [];
        this.GameModeUI = new GameModeUI(this.ID);
        this.ObjectiveUI = new ObjectiveUI(this.ID);        
    }

    Setup() {
        this.SetupPlayerCapturingUI();
        this.SetupGameModeUI();
        this.SetupObjectiveUI();
    }

    SetupPlayerCapturingUI() {        
        for (let i = 0; i < CurrentGameController.CurrentMap.CapturePoints.length; i++) {
            const currentCapturePoint = CurrentGameController.CurrentMap.CapturePoints[i];
            const playerTeamCount = mod.Equals(this.PlayerTeam, mod.GetTeam(1)) ? CurrentGameController.CurrentMap.CapturePoints[i].Team1Players.length : CurrentGameController.CurrentMap.CapturePoints[i].Team2Players.length;
            const enemyTeamCount = mod.Equals(this.PlayerTeam, mod.GetTeam(1)) ? CurrentGameController.CurrentMap.CapturePoints[i].Team2Players.length : CurrentGameController.CurrentMap.CapturePoints[i].Team1Players.length;            
            
            const capturePointUI = new CapturePointUI(this.ID, currentCapturePoint.CapturePointName, currentCapturePoint.Owner, playerTeamCount, enemyTeamCount, this.Player);
            capturePointUI.Setup(this.Player);
            this.CapturePointUIList.push(capturePointUI);
        }        
    }

    SetupGameModeUI() {
        this.GameModeUI.Setup(this.Player);
    }

    UpdateGameModeUI() {
        let capturePointOwners = [];
        for (let i = 0; i < CurrentGameController.CurrentMap.CapturePoints.length; i++) {
            const currentCapturePointOwner = CurrentGameController.CurrentMap.CapturePoints[i].Owner;
            capturePointOwners.push(currentCapturePointOwner);
        }

        this.GameModeUI.Update(mod.GetGameModeScore(mod.GetTeam(1)), mod.GetGameModeScore(mod.GetTeam(2)), capturePointOwners, this.Player);
    }

    SetupObjectiveUI() {
        this.ObjectiveUI.Setup(this.Player);
    }

    UpdatePlayerCapturingUI(capturePointID: number, uiID: number) {        
        const capturePoint = CurrentGameController.CurrentMap.GetCapturePoint(capturePointID);
        if (capturePoint != null) {
            const playerTeamCount = mod.Equals(this.PlayerTeam, mod.GetTeam(1)) ? capturePoint.Team1Count : capturePoint.Team2Count;
            const enemyTeamCount = mod.Equals(this.PlayerTeam, mod.GetTeam(1)) ? capturePoint.Team2Count : capturePoint.Team1Count;            
            const capturePointUI = this.CapturePointUIList[uiID];
            const captureProgress = capturePoint.CaptureProgress;

            capturePointUI.Update(capturePoint.Owner, playerTeamCount, enemyTeamCount, this.Player, captureProgress);
        }        
    }    

    ToggleCapturingUI(capturePointUiID: number, enabled: boolean) {
        this.CapturePointUIList[capturePointUiID].Enable(enabled);
    }    

    async InformGameStart() {
        this.GameModeUI.Toggle(false);
        this.ObjectiveUI.UpdateObjectiveUpdateUI(0, "[Game Info Details]");
        this.ObjectiveUI.ToggleObjectiveUpdate(0, true);
        this.ObjectiveUI.ToggleObjectiveUpdate(1, false);
        await mod.Wait(5);
        this.ObjectiveUI.ToggleObjectiveUpdate(0, false);
        this.GameModeUI.Toggle(true);
    }    
}

class GameModeUI {
    UIControllerID: number;

    UIGameModeContainer: mod.UIWidget;
    UIPlayerTeamScoreBarFill: mod.UIWidget;
    UIPlayerTeamScoreText: mod.UIWidget;
    UIEnemyTeamScoreBarFill: mod.UIWidget;
    UIEnemyTeamScoreText: mod.UIWidget;
    UICapturePoints: mod.UIWidget[]; 

    constructor(_uiControllerID: number) {
        this.UIControllerID = _uiControllerID;

        // UI Widgets
        this.UIGameModeContainer = mod.GetUIRoot();
        this.UIPlayerTeamScoreBarFill = mod.GetUIRoot();
        this.UIPlayerTeamScoreText = mod.GetUIRoot();
        this.UIEnemyTeamScoreBarFill = mod.GetUIRoot();
        this.UIEnemyTeamScoreText = mod.GetUIRoot();
        this.UICapturePoints = [];   
    }

    Setup(player: mod.Player) {
        mod.AddUIContainer("GameModContainer-" + this.UIControllerID, mod.CreateVector(0, 50, 0), mod.CreateVector(400, 85, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.None, player);
        this.UIGameModeContainer = mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID);

        // Player Score
        mod.AddUIContainer("PlayerTeamScoreBar-" + this.UIControllerID, mod.CreateVector(40, 12.5, 0), mod.CreateVector(150, 15, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 1, mod.UIBgFill.Blur, player);
        mod.AddUIContainer("PlayerTeamScoreBarFill-" + this.UIControllerID, mod.CreateVector(40, 12.5, 0), mod.CreateVector(0, 15, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, FriendlyColour, 1, mod.UIBgFill.Solid, player);
        this.UIPlayerTeamScoreBarFill = mod.FindUIWidgetWithName("PlayerTeamScoreBarFill-" + this.UIControllerID);
        mod.AddUIText("PlayerTeamScoreText-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(35, 35, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message(0), 32, FriendlyColour, 1, mod.UIAnchor.Center, player);
        this.UIPlayerTeamScoreText = mod.FindUIWidgetWithName("PlayerTeamScoreText-" + this.UIControllerID);

        // Enemy Score
        mod.AddUIContainer("EnemyTeamScoreBar-" + this.UIControllerID, mod.CreateVector(40, 12.5, 0), mod.CreateVector(150, 15, 0), mod.UIAnchor.TopRight, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 1, mod.UIBgFill.Blur, player);
        mod.AddUIContainer("EnemyTeamScoreBarFill-" + this.UIControllerID, mod.CreateVector(40, 12.5, 0), mod.CreateVector(0, 15, 0), mod.UIAnchor.TopRight, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, EnemyColour, 1, mod.UIBgFill.Solid, player);
        this.UIEnemyTeamScoreBarFill = mod.FindUIWidgetWithName("EnemyTeamScoreBarFill-" + this.UIControllerID);
        mod.AddUIText("EnemyTeamScoreText-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(35, 35, 0), mod.UIAnchor.TopRight, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message(0), 32, EnemyColour, 1, mod.UIAnchor.Center, player);
        this.UIEnemyTeamScoreText = mod.FindUIWidgetWithName("EnemyTeamScoreText-" + this.UIControllerID);

        // Capture Points
        mod.AddUIText("CapturePointA-" + this.UIControllerID, mod.CreateVector(-120, 0, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message("A"), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePoints.push(mod.FindUIWidgetWithName("CapturePointA-" + this.UIControllerID));
        mod.AddUIText("CapturePointB-" + this.UIControllerID, mod.CreateVector(-60, 0, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message("B"), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePoints.push(mod.FindUIWidgetWithName("CapturePointB-" + this.UIControllerID));
        mod.AddUIText("CapturePointC-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message("C"), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePoints.push(mod.FindUIWidgetWithName("CapturePointC-" + this.UIControllerID));
        mod.AddUIText("CapturePointD-" + this.UIControllerID, mod.CreateVector(60, 0, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message("D"), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePoints.push(mod.FindUIWidgetWithName("CapturePointD-" + this.UIControllerID));
        mod.AddUIText("CapturePointE-" + this.UIControllerID, mod.CreateVector(120, 0, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("GameModContainer-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message("E"), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePoints.push(mod.FindUIWidgetWithName("CapturePointE-" + this.UIControllerID));
    }

    Update(team1Score: number, team2Score: number, capturePointOwners: mod.Team[], player: mod.Player) {
        const playerTeam = mod.Equals(mod.GetTeam(player), mod.GetTeam(1)) ? mod.GetTeam(1) : mod.GetTeam(2);
        const enemyTeam = mod.Equals(mod.GetTeam(player), mod.GetTeam(1)) ? mod.GetTeam(2) : mod.GetTeam(1);
        const playerTeamScore = mod.Equals(mod.GetTeam(player), playerTeam) ? team1Score : team2Score;
        const enemyTeamScore = mod.Equals(mod.GetTeam(player), playerTeam) ? team2Score : team1Score;                

        // Score
        mod.SetUITextLabel(this.UIPlayerTeamScoreText, mod.Message(playerTeamScore));
        mod.SetUIWidgetSize(this.UIPlayerTeamScoreBarFill, mod.CreateVector((playerTeamScore / mod.GetTargetScore()) * 150, 12.5, 0));
        mod.SetUITextLabel(this.UIEnemyTeamScoreText, mod.Message(enemyTeamScore));
        mod.SetUIWidgetSize(this.UIEnemyTeamScoreBarFill, mod.CreateVector((enemyTeamScore / mod.GetTargetScore()) * 150, 12.5, 0));

        // Capture Points
        for (let i = 0; i < capturePointOwners.length; i++) {
            if (mod.Equals(capturePointOwners[i], playerTeam)) {
                mod.SetUIWidgetBgColor(this.UICapturePoints[i], FriendlyColour);
                mod.SetUIWidgetBgFill(this.UICapturePoints[i], mod.UIBgFill.Solid);
            } else if (mod.Equals(capturePointOwners[i], enemyTeam)) {
                mod.SetUIWidgetBgColor(this.UICapturePoints[i], EnemyColour);
                mod.SetUIWidgetBgFill(this.UICapturePoints[i], mod.UIBgFill.Solid);
            } else {
                mod.SetUIWidgetBgColor(this.UICapturePoints[i], mod.CreateVector(0.5, 0.5, 0.5));
                mod.SetUIWidgetBgFill(this.UICapturePoints[i], mod.UIBgFill.Blur);
            }
        }
    }

    Toggle(enabled: boolean) {
        mod.SetUIWidgetVisible(this.UIGameModeContainer, enabled);
    }
}

class ObjectiveUI {
    UIControllerID: number;    
    MainObjectiveUpdatePos: mod.Vector;
    MainObjectiveUpdateSize: mod.Vector;

    // UI Widgets
    UIObjectiveInfo: mod.UIWidget;
    UIObjectiveInfoText: mod.UIWidget;
    UIObjectiveAlert: mod.UIWidget;
    UIObjectiveAlertText: mod.UIWidget;

    constructor(_uiControllerID: number) {
        this.UIControllerID = _uiControllerID;
        this.MainObjectiveUpdatePos = mod.CreateVector(0, 75, 0);
        this.MainObjectiveUpdateSize = mod.CreateVector(600, 100, 0);

        this.UIObjectiveInfo = mod.GetUIRoot();
        this.UIObjectiveAlert = mod.GetUIRoot();
        this.UIObjectiveInfoText = mod.GetUIRoot();
        this.UIObjectiveAlertText = mod.GetUIRoot();
    }

    Setup(player: mod.Player) {
        const MainObjectiveInformationColour = FriendlyColour;
        const MainObjectiveAlertColour = mod.CreateVector(1, 0.3, 0.3);

        // MAIN OBJECTIVE INFO
        mod.AddUIContainer("MainObjectiveInfo-" + this.UIControllerID, this.MainObjectiveUpdatePos, this.MainObjectiveUpdateSize, mod.UIAnchor.TopCenter, mod.GetUIRoot(), false, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, player);
        this.UIObjectiveInfo = mod.FindUIWidgetWithName("MainObjectiveInfo-" + this.UIControllerID);

        // Border
        mod.AddUIContainer("MainObjectiveInfoTopLeftBorder-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(270, 15, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("MainObjectiveInfo-" + this.UIControllerID),
            true, 0, MainObjectiveInformationColour, 1, mod.UIBgFill.Solid, player);
        mod.AddUIImage("MainObjectiveInfoImage-" + this.UIControllerID, mod.CreateVector(0, -12.5, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.TopCenter, mod.FindUIWidgetWithName("MainObjectiveInfo-" + this.UIControllerID), true, 0,
            MainObjectiveInformationColour, 0.5, mod.UIBgFill.None, mod.UIImageType.CrownSolid, MainObjectiveInformationColour, 1);
        mod.AddUIContainer("MainObjectiveInfoTopRightBorder-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(270, 15, 0), mod.UIAnchor.TopRight, mod.FindUIWidgetWithName("MainObjectiveInfo-" + this.UIControllerID),
            true, 0, MainObjectiveInformationColour, 1, mod.UIBgFill.Solid, player);
        mod.AddUIContainer("MainObjectiveInfoBottomBorder-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(600, 15, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("MainObjectiveInfo-" + this.UIControllerID),
            true, 0, MainObjectiveInformationColour, 1, mod.UIBgFill.Solid, player);

        // Text
        mod.AddUIText("MainObjectiveInfoText-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(600, 40, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("MainObjectiveInfo-" + this.UIControllerID),
            true, 0, MainObjectiveInformationColour, 0.5, mod.UIBgFill.None, mod.Message("Main Objective Info Text"), 38, MainObjectiveInformationColour, 1, mod.UIAnchor.Center, player);
        this.UIObjectiveInfoText = mod.FindUIWidgetWithName("MainObjectiveInfoText-" + this.UIControllerID);
        
        // MAIN OBJECTIVE ALERT
        mod.AddUIContainer("MainObjectiveAlert-" + this.UIControllerID, this.MainObjectiveUpdatePos, this.MainObjectiveUpdateSize, mod.UIAnchor.TopCenter, mod.GetUIRoot(), false, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, player);
        this.UIObjectiveAlert = mod.FindUIWidgetWithName("MainObjectiveAlert-" + this.UIControllerID);

        // Border
        mod.AddUIContainer("MainObjectiveAlertTopLeftBorder-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(270, 15, 0), mod.UIAnchor.TopLeft, mod.FindUIWidgetWithName("MainObjectiveAlert-" + this.UIControllerID),
            true, 0, MainObjectiveAlertColour, 1, mod.UIBgFill.Solid, player);
        mod.AddUIImage("MainObjectiveAlertImage-" + this.UIControllerID, mod.CreateVector(0, -12.5, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.TopCenter, mod.FindUIWidgetWithName("MainObjectiveAlert-" + this.UIControllerID), true, 0,
            MainObjectiveAlertColour, 0.5, mod.UIBgFill.None, mod.UIImageType.CrownSolid, MainObjectiveAlertColour, 1);
        mod.AddUIContainer("MainObjectiveAlertTopRightBorder-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(270, 15, 0), mod.UIAnchor.TopRight, mod.FindUIWidgetWithName("MainObjectiveAlert-" + this.UIControllerID),
            true, 0, MainObjectiveAlertColour, 1, mod.UIBgFill.Solid, player);
        mod.AddUIContainer("MainObjectiveAlertBottomBorder-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(600, 15, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("MainObjectiveAlert-" + this.UIControllerID),
            true, 0, MainObjectiveAlertColour, 1, mod.UIBgFill.Solid, player);

        // Text
        mod.AddUIText("MainObjectiveAlertText-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(600, 40, 0), mod.UIAnchor.Center, mod.FindUIWidgetWithName("MainObjectiveAlert-" + this.UIControllerID),
            true, 0, MainObjectiveAlertColour, 0.5, mod.UIBgFill.None, mod.Message("Main Objective Alert Text"), 38, MainObjectiveAlertColour, 1, mod.UIAnchor.Center, player);        
        this.UIObjectiveAlertText = mod.FindUIWidgetWithName("MainObjectiveAlertText-" + this.UIControllerID);        
    }

    // UpdateType: 0 = Info | 1 = Alert
    UpdateObjectiveUpdateUI(updateType: number, message: string) {
        if (updateType == 0) {
            mod.SetUITextLabel(this.UIObjectiveInfoText, mod.Message(message));
        } else {
            mod.SetUITextLabel(this.UIObjectiveAlertText, mod.Message(message));
        }
    }

    // UpdateType: 0 = Info | 1 = Alert
    ToggleObjectiveUpdate(updateType: number, enabled: boolean) {
        if (updateType == 0) {
            mod.SetUIWidgetVisible(this.UIObjectiveInfo, enabled);
        } else {
            mod.SetUIWidgetVisible(this.UIObjectiveAlert, enabled);
        }
    }
}

class CapturePointUI {
    UIControllerID: number;    
    CapturePointName: string;        
    PlayerTeamCount: number;
    EnemyTeamCount: number;

    // UI Wigets
    UIContainer: mod.UIWidget;    
    UICapturePointName: mod.UIWidget;
    UICapturePointNameBg: mod.UIWidget;
    UICapturePointProgressFill: mod.UIWidget;
    UIFriendlyCaptureBar: mod.UIWidget;
    UIFriendlyPlayerCount: mod.UIWidget;
    UIEnemyCaptureBar: mod.UIWidget;
    UIEnemyPlayerCount: mod.UIWidget;

    constructor(_uiControllerID: number, _capturePointName: string, _flagOwner: mod.Team, _playerTeamCount: number, _enemyTeamCount: number, _player: mod.Player) {        
        this.UIControllerID = _uiControllerID;        
        this.CapturePointName = _capturePointName;                
        this.PlayerTeamCount = _playerTeamCount;
        this.EnemyTeamCount = _enemyTeamCount;

        // Temporarily set to root and then reassign during setup
        this.UIContainer = mod.GetUIRoot();        
        this.UICapturePointName = mod.GetUIRoot();
        this.UICapturePointNameBg = mod.GetUIRoot();
        this.UICapturePointProgressFill = mod.GetUIRoot();
        this.UIFriendlyCaptureBar = mod.GetUIRoot();
        this.UIFriendlyPlayerCount = mod.GetUIRoot();
        this.UIEnemyCaptureBar = mod.GetUIRoot();        
        this.UIEnemyPlayerCount = mod.GetUIRoot();        
    }

    Setup(player: mod.Player) {        
        const capturePointBgColour = mod.CreateVector(0.5, 0.5, 0.5);
        const captureStateTextColour = mod.CreateVector(1, 1, 1);
        const playerTeamRatio = 0.5;
        const enemyTeamRatio = 0.5;

        mod.AddUIContainer("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(0, 180, 0), mod.CreateVector(150, 85, 0), mod.UIAnchor.TopCenter, mod.GetUIRoot(), false, 0, mod.CreateVector(0, 0, 0), 0, mod.UIBgFill.None, player);
        this.UIContainer = mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID);

        mod.AddUIText("CapturePointUINameBg-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(0, 20, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.TopCenter, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 10, capturePointBgColour, 1, mod.UIBgFill.Blur, mod.Message(""), 16, mod.CreateVector(1, 1, 1), 0, mod.UIAnchor.Center, player);
        this.UICapturePointNameBg = mod.FindUIWidgetWithName("CapturePointUINameBg-" + this.CapturePointName + "-" + this.UIControllerID);
        
        mod.AddUIText("CapturingPointUINameFill" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(0, 15, 0), mod.CreateVector(50, 0, 0), mod.UIAnchor.BottomCenter, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 10, capturePointBgColour, 1, mod.UIBgFill.Solid, mod.Message(""), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePointProgressFill = mod.FindUIWidgetWithName("CapturingPointUINameFill" + this.CapturePointName + "-" + this.UIControllerID);
        mod.AddUIText("CapturePointUIName-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(0, 20, 0), mod.CreateVector(50, 50, 0), mod.UIAnchor.TopCenter, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 10, capturePointBgColour, 1, mod.UIBgFill.None, mod.Message(this.CapturePointName), 16, mod.CreateVector(1, 1, 1), 1, mod.UIAnchor.Center, player);
        this.UICapturePointName = mod.FindUIWidgetWithName("CapturePointUIName-" + this.CapturePointName + "-" + this.UIControllerID);

        mod.AddUIText("FriendlyCaptureBar-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(15, 0, 0), mod.CreateVector(playerTeamRatio * 120, 10, 0), mod.UIAnchor.BottomLeft, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 0, FriendlyColour, 1, mod.UIBgFill.Solid, mod.Message(""), 0, mod.CreateVector(0, 0, 0), 0, mod.UIAnchor.Center, player);
        this.UIFriendlyCaptureBar = mod.FindUIWidgetWithName("FriendlyCaptureBar-" + this.CapturePointName + "-" + this.UIControllerID);

        mod.AddUIText("FriendlyPlayerCountText-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(15, 15, 0), mod.UIAnchor.BottomLeft, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message(this.PlayerTeamCount), 16, FriendlyColour, 1, mod.UIAnchor.Center, player);
        this.UIFriendlyPlayerCount = mod.FindUIWidgetWithName("FriendlyPlayerCountText-" + this.CapturePointName + "-" + this.UIControllerID);

        mod.AddUIText("EnemyCaptureBar-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(15, 0, 0), mod.CreateVector(enemyTeamRatio * 120, 10, 0), mod.UIAnchor.BottomRight, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 0, mod.CreateVector(1, 0, 0), 1, mod.UIBgFill.Solid, mod.Message(""), 0, mod.CreateVector(0, 0, 0), 0, mod.UIAnchor.Center, player);
        this.UIEnemyCaptureBar = mod.FindUIWidgetWithName("EnemyCaptureBar-" + this.CapturePointName + "-" + this.UIControllerID);

        mod.AddUIText("EnemyPlayerCountText-" + this.CapturePointName + "-" + this.UIControllerID, mod.CreateVector(0, 0, 0), mod.CreateVector(15, 15, 0), mod.UIAnchor.BottomRight, mod.FindUIWidgetWithName("CapturingPointUI-" + this.CapturePointName + "-" + this.UIControllerID),
            true, 0, mod.CreateVector(0.5, 0.5, 0.5), 0.5, mod.UIBgFill.Blur, mod.Message(this.EnemyTeamCount), 16, mod.CreateVector(1, 0, 0), 1, mod.UIAnchor.Center, player);
        this.UIEnemyPlayerCount = mod.FindUIWidgetWithName("EnemyPlayerCountText-" + this.CapturePointName + "-" + this.UIControllerID);        
    }

    Enable(enabled: boolean) {        
        mod.SetUIWidgetVisible(this.UIContainer, enabled);        
    }

    Update(owner: mod.Team, team1Count: number, team2Count: number, player: mod.Player, captureProgress: number) {        
        const playerTeamCount = mod.Equals(mod.GetTeam(player), mod.GetTeam(1)) ? team1Count : team2Count;  
        const enemyTeamCount = mod.Equals(mod.GetTeam(player), mod.GetTeam(1)) ? team2Count : team1Count;          

        let capturePointBgColour = mod.CreateVector(0.5, 0.5, 0.5);
        let capturePointBgFill = mod.UIBgFill.Blur;
        const playerTeamRatio = (playerTeamCount / (playerTeamCount + enemyTeamCount));
        const enemyTeamRatio = (enemyTeamCount / (playerTeamCount + enemyTeamCount));

        // Capture Point Name      
        if (mod.Equals(owner, mod.GetTeam(1)) || mod.Equals(owner, mod.GetTeam(2))) {
            capturePointBgColour = mod.Equals(mod.GetTeam(player), owner) ? FriendlyColour : EnemyColour;
            capturePointBgFill = mod.UIBgFill.Solid;        
        }        
        mod.SetUIWidgetBgColor(this.UICapturePointName, capturePointBgColour);
        mod.SetUIWidgetBgFill(this.UICapturePointName, capturePointBgFill);        

        // Capture Progress        
        let captureProgressFillColour = mod.CreateVector(0.5, 0.5, 0.5);
        if (mod.Equals(mod.GetTeam(player), mod.GetTeam(1))) {
            if (captureProgress > 0) {
                captureProgressFillColour = FriendlyColour;
            } else {
                captureProgressFillColour = EnemyColour;
            }
        } else {
            if (captureProgress < 0) {
                captureProgressFillColour = FriendlyColour;
            } else {
                captureProgressFillColour = EnemyColour;
            }
        }    

        mod.SetUIWidgetBgColor(this.UICapturePointProgressFill, captureProgressFillColour);
        mod.SetUIWidgetSize(this.UICapturePointProgressFill, mod.CreateVector(50, (Math.abs((captureProgress / 20)) * 50), 0));

        // Capturing Player Counts
        mod.SetUITextLabel(this.UIFriendlyPlayerCount, mod.Message(playerTeamCount));
        mod.SetUIWidgetSize(this.UIFriendlyCaptureBar, mod.CreateVector(playerTeamRatio * 120, 8, 0));
        mod.SetUITextLabel(this.UIEnemyPlayerCount, mod.Message(enemyTeamCount));
        mod.SetUIWidgetSize(this.UIEnemyCaptureBar, mod.CreateVector(enemyTeamRatio * 120, 8, 0));        
    }
}

class CapturePoint {
    CapturePoint: mod.CapturePoint;
    ID: number;
    UiId: number;
    CapturePointName: string;
    Team1Players: Player[];
    Team2Players: Player[];
    Team1Count: number;
    Team2Count: number;
    Owner: mod.Team;        
    CaptureUIs: mod.UIWidget[];    
    Team1VehicleSpawnIDs: number[];
    Team2VehicleSpawnIDs: number[];
    IsCapturing: boolean;
    IsBleeding: boolean;
    CaptureProgress: number;

    constructor(_capturePoint: mod.CapturePoint, _id: number, _uiId: number, _capturePointName: string, _team1VehiclesSpawnIDs: number[], _team2VehiclesSpawnIDs: number[]) {
        this.CapturePoint = _capturePoint;
        this.ID = _id;
        this.UiId = _uiId;
        this.CapturePointName = _capturePointName;
        this.Team1Players = [];
        this.Team2Players = [];
        this.Team1Count = 0;
        this.Team2Count = 0;
        this.Owner = mod.GetTeam(0);        
        this.CaptureUIs = [];        
        this.Team1VehicleSpawnIDs = _team1VehiclesSpawnIDs;
        this.Team2VehicleSpawnIDs = _team2VehiclesSpawnIDs;
        this.IsCapturing = false;
        this.IsBleeding = false;
        this.CaptureProgress = 0;

        this.Setup();
    }

    Setup() {
        mod.EnableGameModeObjective(this.CapturePoint , true);
        mod.SetCapturePointCapturingTime(this.CapturePoint, 20);
        mod.SetCapturePointNeutralizationTime(this.CapturePoint, 20);
        mod.SetMaxCaptureMultiplier(this.CapturePoint, 5);
    }

    PlayerEnters(player: Player) {        
        if (this.IsCapturing == false) {
            this.IsBleeding = false;
            this.IsCapturing = true;
            this.Capturing();
        }

        if (mod.Equals(mod.GetTeam(player.Player), mod.GetTeam(1))) {            
            this.Team1Count++;
            this.Team1Players.push(player);
        } else {
            this.Team2Count++;
            this.Team2Players.push(player);
        }                        
        
        this.UpdateCapturingUI();
        this.ShowPlayerCapturingUI(player);
    } 

    PlayerLeaves(player: Player) {
        if (mod.Equals(mod.GetTeam(player.Player), mod.GetTeam(1))) {            
            this.Team1Count--;
        } else {
            this.Team2Count--;
        }

        if (this.Team1Count == 0 && this.Team2Count == 0) {
            this.Team1Players = [];
            this.Team2Players = [];
            this.IsCapturing = false;

            if (this.CaptureProgress < 30 && this.CaptureProgress > -30) {
                this.IsBleeding = true;
                this.Bleeding();
            }
        }

        this.HidePlayerCapturingUI(player);
        this.UpdateCapturingUI();    
    }   

    async Capturing() {        
        while (this.IsCapturing == true) {
            if (this.Team1Count > this.Team2Count && this.CaptureProgress < 20) {
                const multiplier = this.Team1Count > 5 ? 5 : this.Team1Count;
                this.CaptureProgress += (0.05 * multiplier);
            } else if (this.Team2Count > this.Team1Count && this.CaptureProgress > -20) {
                const multiplier = this.Team2Count > 5 ? 5 : this.Team2Count;
                this.CaptureProgress -= (0.05 * multiplier);
            }
            this.UpdateCapturingUI();

            await mod.Wait(0.05);
        }
    }

    // Capture progress depletes when no players on the point
    async Bleeding() {
        while (this.IsBleeding == true) {
            if (this.CaptureProgress > -0.1 && this.CaptureProgress < 0.1) {
                this.IsBleeding = false;
            }

            if (this.CaptureProgress < 0) {
                this.CaptureProgress += 0.05;
            } else {
                this.CaptureProgress -= 0.05;
            }
            await mod.Wait(0.2);
        }
    }

    UpdateCapturingUI() {        
        for (let i = 0; i < this.Team1Players.length; i++) {
            const player = this.Team1Players[i];
            player.PlayerUIController.UpdatePlayerCapturingUI(this.ID, this.UiId);            
        }

        for (let i = 0; i < this.Team2Players.length; i++) {
            const player = this.Team1Players[i];
            player.PlayerUIController.UpdatePlayerCapturingUI(this.ID, this.UiId);            
        }
    }

    ShowPlayerCapturingUI(player: Player) {        
        player.PlayerUIController.ToggleCapturingUI(this.UiId, true);
    }

    HidePlayerCapturingUI(player: Player) {
        player.PlayerUIController.ToggleCapturingUI(this.UiId, false);
    }  

    Captured(newOwner: mod.Team) {                   
        this.Owner = newOwner;
        this.UpdateCapturingUI();
        this.SpawnVehicles(this.Owner);                   
    }

    SpawnVehicles(owner: mod.Team) {        
        // Enable Team 1 Vehicle Spawns AND Disable Team 2 Vehicle Spawns
        for (let i = 0; i < this.Team1VehicleSpawnIDs.length; i++) {
            const team1Spawn = mod.GetVehicleSpawner(this.Team1VehicleSpawnIDs[i]);
            const team2Spawn = mod.GetVehicleSpawner(this.Team2VehicleSpawnIDs[i]);
            if (mod.Equals(owner, mod.GetTeam(1))) {                
                mod.ForceVehicleSpawnerSpawn(team1Spawn);
                mod.SetVehicleSpawnerAutoSpawn(team1Spawn, true);
                mod.SetVehicleSpawnerAutoSpawn(team2Spawn, false);
            } else {
                mod.ForceVehicleSpawnerSpawn(team2Spawn);
                mod.SetVehicleSpawnerAutoSpawn(team2Spawn, true);
                mod.SetVehicleSpawnerAutoSpawn(team1Spawn, false);                
            }
        }                    
    }    
}

// MAP SPECIFICS
// Setup each map here with capture points, their IDs, Name, and team vehicle spawns
// Only firestorm partly setup in example
const FirestormCapturePoints: CapturePoint[] = [
    new CapturePoint(mod.GetCapturePoint(1), 101, 0, "A", [1010], [1010]),
    new CapturePoint(mod.GetCapturePoint(2), 102, 1, "B", [], []),
    new CapturePoint(mod.GetCapturePoint(3), 103, 2, "C", [], []),
    new CapturePoint(mod.GetCapturePoint(4), 104, 3, "D", [], []),
    new CapturePoint(mod.GetCapturePoint(5), 105, 4, "E", [], []),
]
const Map_Firestorm: Map = new Map(FirestormCapturePoints);

// GLOBAL VARIABLES
var CurrentGameController: GameController;

// EVENTS

export async function OnPlayerJoinGame(eventPlayer: mod.Player): Promise<void> {
    // Wait for CurrentGameController Setup
    await WaitUntil(100, () => CurrentGameController != undefined);
    CurrentGameController.PlayerController.SetupPlayer(eventPlayer);
}

export function OnPlayerUndeploy(eventPlayer: mod.Player) {    
    const player = CurrentGameController.PlayerController.GetPlayer(eventPlayer);
    player.Stats.AddDeath();
    player.Stats.UpdateScore()
}

export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    const player = CurrentGameController.PlayerController.GetPlayer(eventPlayer);
    
    player.Stats.AddKill();
    player.Stats.UpdateScore();
}

export function OnPlayerEarnedKillAssist(eventPlayer: mod.Player, eventOtherPlayer: mod.Player) {
    const player = CurrentGameController.PlayerController.GetPlayer(eventPlayer);

    player.Stats.AddAssist();
    player.Stats.UpdateScore();
}

export function OnPlayerEnterCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {    
    const capturePoint = CurrentGameController.CurrentMap.GetCapturePoint(mod.GetObjId(eventCapturePoint));    
    if (capturePoint != null) {
        const player = CurrentGameController.PlayerController.GetPlayer(eventPlayer);
        capturePoint.PlayerEnters(player);    
    }        
}

export async function OnCapturePointCaptured(eventCapturePoint: mod.CapturePoint): Promise<void> {    
    const capturePoint = CurrentGameController.CurrentMap.GetCapturePoint(mod.GetObjId(eventCapturePoint));
    if (capturePoint != null) {
        capturePoint.Captured(mod.GetCurrentOwnerTeam(eventCapturePoint));

        if (mod.Equals(mod.GetCurrentOwnerTeam(eventCapturePoint), mod.GetTeam(1))) {            
            await WaitUntil(100, () => capturePoint.Team1Players.length == capturePoint.Team1Count);
            for (let i = 0; i < capturePoint.Team1Count; i++) {                
                const player = capturePoint.Team1Players[i];
                player.Stats.AddFlagCapture();
                player.Stats.UpdateScore();
            }
        } else {
            await WaitUntil(100, () => capturePoint.Team2Players.length == capturePoint.Team2Count);
            for (let i = 0; i < capturePoint.Team2Count; i++) {
                const player = capturePoint.Team2Players[i];
                player.Stats.AddFlagCapture();
                player.Stats.UpdateScore();
            }
        }    
    }    
    
    CurrentGameController.UpdateGameModeUI();
}

export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    const capturePoint = CurrentGameController.CurrentMap.GetCapturePoint(mod.GetObjId(eventCapturePoint));
    if (capturePoint != null) {
        capturePoint.UpdateCapturingUI();        
    }
}

export function OnPlayerExitCapturePoint(eventPlayer: mod.Player, eventCapturePoint: mod.CapturePoint): void {
    const capturePoint = CurrentGameController.CurrentMap.GetCapturePoint(mod.GetObjId(eventCapturePoint));    
    if (capturePoint != null) {
        const player = CurrentGameController.PlayerController.GetPlayer(eventPlayer);
        capturePoint.PlayerLeaves(player);
    }
}

export async function OnGameModeStarted() {
    // SETUP    
    CurrentGameController = new GameController();
    CurrentGameController.Setup();        

    // Wait until at least one player on each team has spawned
    await WaitUntil(100, () => {
        let allPlayers = CurrentGameController.PlayerController.PlayerList
        let team1Count = allPlayers.filter((player) => mod.Equals(mod.GetTeam(player.Player), mod.GetTeam(1)));
        let team2Count = allPlayers.filter((player) => mod.Equals(mod.GetTeam(player.Player), mod.GetTeam(2)));

        return (team1Count.length >= 1 && team2Count.length >= 1)
    });
    
    DisplayGameModeObjective();
}

// HELPER FUNCTIONS
function DisplayGameModeObjective() {
    // Display Initial Game Mode Objective to all players
    CurrentGameController.InformPlayers(1, null);    
}

function FilteredArray(array: mod.Array, cond: (currentElement: any) => boolean): mod.Array {
    const arr = modlib.ConvertArray(array);
    let v = mod.EmptyArray();
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        let currentElement = arr[i];
        if (cond(currentElement)) v = mod.AppendToArray(v, currentElement);
    }
    return v;    
}

async function WaitUntil(delay: number, cond: () => boolean) {
    // complete rush hack. this will likely wait way too long and other problems.
    let deltaCount = 10;
    let deltaWait = delay / deltaCount;
    for (let t = 0; t < deltaCount; t++) {
        if (cond()) break;
        await mod.Wait(deltaWait);
    }
}

function getPlayersInTeam(team: mod.Team) {
    const allPlayers = mod.AllPlayers();
    const n = mod.CountOf(allPlayers);
    let teamMembers = [];

    for (let i = 0; i < n; i++) {
        let player = mod.ValueInArray(allPlayers, i) as mod.Player;
        if (mod.Equals(mod.GetTeam(player), team)) {
            teamMembers.push(player);
        }
    }
    return teamMembers;
}

