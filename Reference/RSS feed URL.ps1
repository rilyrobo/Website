# Define the URL of the RSS feed and the output CSV file
$rssUrl = "https://backend.deviantart.com/rss.xml?q=gallery:RilyRobo/57218117/the-day-nobody-died"
$outputCsv = "E:\Download\Website\comics\day-nobody-died.csv"

# Download and parse the RSS feed
try {
    Write-Host "Fetching RSS feed..."
    $rssFeed = [xml](Invoke-WebRequest -Uri $rssUrl -UseBasicParsing).Content
} catch {
    Write-Host "Failed to fetch RSS feed. Check the URL and try again."
    exit
}

# Prepare a list to store the extracted data
$data = @()

# Extract titles and image URLs
foreach ($item in $rssFeed.rss.channel.item) {
    # Ensure we extract single string values
    $title = [string]$item.title
    $imageUrl = [string]$item.thumbnail.url # Thumbnail URL is stored here

    # Add to data array as a flattened object
    $data += [PSCustomObject]@{
        Title    = $title
        ImageUrl = $imageUrl
    }
}

# Export to CSV
if ($data.Count -gt 0) {
    Write-Host "Exporting data to CSV..."
    $data | Export-Csv -Path $outputCsv -NoTypeInformation -Encoding UTF8
    Write-Host "Export completed! File saved as $outputCsv"
} else {
    Write-Host "No data found in the RSS feed."
}
