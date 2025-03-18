# Replace with your DeviantArt RSS feed URL
$RssFeedUrl = "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died"
$OutputFileName = "rss-the-day-nobody-died.js"
$TargetDimensions = "w_1024,h_4452,q_80"

Write-Host "Fetching RSS feed..."
try {
    # Fetch the RSS feed
    $Response = Invoke-WebRequest -Uri $RssFeedUrl -ErrorAction Stop
    $XmlContent = $Response.Content

    # Parse the XML
    $XmlDoc = [xml]$XmlContent

    # Create a namespace manager
    $NamespaceManager = New-Object System.Xml.XmlNamespaceManager($XmlDoc.NameTable)
    $NamespaceManager.AddNamespace("media", "http://search.yahoo.com/mrss/")

    $Items = @()

    foreach ($Item in $XmlDoc.rss.channel.item) {
        $Title = $Item.title.'#text'
        $ImageNode = $Item.SelectSingleNode("media:content", $NamespaceManager)
        if ($ImageNode -ne $null) {
            $Image = $ImageNode.url
            $Image = $Image -replace 'w_\d+,h_\d+,q_\d+', $TargetDimensions

            $Items += @{
                title = $Title
                image = $Image
            }
        }
    }

    if ($Items.Count -eq 0) {
        Write-Host "No gallery items found in the RSS feed." -ForegroundColor Yellow
        return
    }

    # Convert to JSON and format as a JS variable
    $JsonData = $Items | ConvertTo-Json -Depth 10 -Compress
    $FormattedJsonData = $JsonData -replace '},{', "},`n    {"
    $FormattedJsonData = $FormattedJsonData -replace '"title":', 'title:'
    $FormattedJsonData = $FormattedJsonData -replace '"image":', 'image:'
    $FileContent = "const galleryData = [`n    $FormattedJsonData`n];"

    # Save to a file
    Set-Content -Path $OutputFileName -Value $FileContent -Encoding UTF8
    Write-Host "Gallery data saved to $OutputFileName" -ForegroundColor Green
} catch {
    Write-Host "Error fetching or processing RSS feed: $_" -ForegroundColor Red
}