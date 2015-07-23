#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
#include, Gdip_All.ahk 
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.
CoordMode, Mouse, Window

Key = %1%

SteamExe := "D:\Program Files (x86)\Steam\Steam.exe"
SteamArg := "steam://open/activateproduct"

SteamCmd := SteamExe . " " . SteamArg
ImgFile := "screen_" . A_Now . ".png"

Run, %SteamCmd%
WinWaitActive, Product Activation

Send {Enter}{Enter}
Sleep, 200
Send %Key%
Sleep, 200
Send {Enter} ;Next
Sleep, 200
WinWaitActive, Product Activation
Sleep, 200
Screenshot(ImgFile)
; Duplicate -> schon geclaimt! macht nix, enter+esc schließen das fenster
Send {Enter}{Esc}

return



Screenshot(outfile)
{
    pToken := Gdip_Startup()

    screen=0|0|%A_ScreenWidth%|%A_ScreenHeight%
    pBitmap := Gdip_BitmapFromScreen(screen)

    Gdip_SaveBitmapToFile(pBitmap, outfile, 100)
    Gdip_DisposeImage(pBitmap)
    Gdip_Shutdown(pToken)
}