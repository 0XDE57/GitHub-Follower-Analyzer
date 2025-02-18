let githubUsername;

let followerNames = [];
let followingNames = [];
let followersNotFollowing = [];
let followingNotFollowers = [];
let followersFollowing = [];

let currentPage = 1;

$(document).ready(function () {
    $('#github-form').submit(function (event) {
        event.preventDefault();

        showLoading();
        $('#form').hide();

        githubUsername = $('#github-username').val();
        githubFineGrainAccessToken = $('#github-access-token').val();

        authenticateAndFetchData(githubUsername, githubFineGrainAccessToken);
    });

    // search new user
    $('#searchNew').click(function () {
        initialView();

        $('#github-username').val('');
        $('#github-username').focus();
    });

    $('#btnSortIDAsc').click(function () {
        followerNames.sort(sortID);
        followingNames.sort(sortID);
        followersNotFollowing.sort(sortID);
        followingNotFollowers.sort(sortID);
        followersFollowing.sort(sortID);
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    });

    $('#btnSortIDDesc').click(function () {
        followerNames.sort(sortID).reverse();
        followingNames.sort(sortID).reverse();
        followersNotFollowing.sort(sortID).reverse();
        followingNotFollowers.sort(sortID).reverse();
        followersFollowing.sort(sortID).reverse();
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    });

    $('#btnSortAsc').click(function () {
        followerNames.sort(sortIgnoreCase);
        followingNames.sort(sortIgnoreCase);
        followersNotFollowing.sort(sortIgnoreCase);
        followingNotFollowers.sort(sortIgnoreCase);
        followersFollowing.sort(sortIgnoreCase);
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    });

    $('#btnSortDesc').click(function () {
        followerNames.sort(sortIgnoreCase).reverse();
        followingNames.sort(sortIgnoreCase).reverse();
        followersNotFollowing.sort(sortIgnoreCase).reverse();
        followingNotFollowers.sort(sortIgnoreCase).reverse();
        followersFollowing.sort(sortIgnoreCase).reverse();
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    });

    $('#btnDownloadJSON').click(function () {
        // build up followers data object and save as json
        let userData = [
            { "user": githubUsername },
            { "followers": followerNames },
            { "following": followingNames },
            { "followersFollowing" : followersFollowing },
            { "followingNotFollowers" : followingNotFollowers },
            { "followersNotFollowing" : followersNotFollowing }
        ];

        let jsonFollowers = JSON.stringify(userData, null, 2);
        let blob = new Blob([jsonFollowers]);
        let date = new Date().toLocaleDateString().replaceAll('/', '-');
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${githubUsername}_followers_${date}.txt`;
        link.click();
    });
});

function sortIgnoreCase(a, b) {
  return a.login.toLowerCase().localeCompare(b.login.toLowerCase());
}

function sortID(a, b) {
  return a.id - b.id;
}

////////// Error //////////
function showError(error) {
    Swal.fire({
        title: 'Error fetching data!',
        text: 'check username and token. Message: ' + error.message,
        icon: 'error',
        confirmButtonText: 'ok',
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn btn-outline-success'
        }
    });
}

////////// loading //////////

// Hide the loading when the document is fully loaded
document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        hideLoading();
        initialView();
    }
};

function initialView() {
    $('#form').show();
    $('#userDetails').hide();
    $('#img-divs').hide();
    $('#summary').hide();
    $('#followers-not-following-div').hide();
    $('#following-not-followers-div').hide();
    $('#followers-following-div').hide();
    $('#loading-container').hide();
    $('#searchNew').hide();
}

function showLoading() {
    $('#loading-container').show();

    $('#userDetails').hide();
    $('#img-divs').hide();
    $('#summary').hide();
    $('#followers-not-following-div').hide();
    $('#following-not-followers-div').hide();
    $('#followers-following-div').hide();
    $('#searchNew').hide();
}

function hideLoading() {
    $('#loading-container').hide();

    $('#userDetails').show();
    $('#img-divs').show();
    $('#summary').show();
    $('#followers-not-following-div').show();
    $('#following-not-followers-div').show();
    $('#followers-following-div').show();
    $('#searchNew').show();
}

////////// fetch followers data //////////
async function authenticateAndFetchData(username, accessToken) {
    try {

        let userResponse;
        if (accessToken === "") {
            userResponse = await fetch(`https://api.github.com/users/${username}`, {
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Accept": "application/vnd.github+json"
                }
            });
        } else {
            userResponse = await fetch(`https://api.github.com/users/${username}`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Accept": "application/vnd.github+json"
                }
            });
        }
        const user = await userResponse.json();

        const followers = await fetchAllFollowers(username, accessToken);
        const followings = await fetchAllFollowings(username, accessToken);

        $('#userImage').attr('src', user.avatar_url);
        $('#userName').text(user.login);
        hideLoading();

        displayFollowers(followers);
        displayFollowing(followings);

        followerNames = followers.map(follower => ({login: follower.login, id: follower.id}));
        followingNames = followings.map(following => ({login: following.login, id: following.id}));

        followersNotFollowing = followerNames.filter(name => !followingNames.map(x => x.login).includes(name.login));
        followingNotFollowers = followingNames.filter(name => !followerNames.map(x => x.login).includes(name.login));
        followersFollowing = followerNames.filter(name => followingNames.map(x => x.login).includes(name.login));

        checkEmpty();
        updateSummary();

        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();

    } catch (error) {
        initialView();
        console.error('Error:', error);
        showError(error);
    }
}

function fetchAllFollowers(username, accessToken) {
    return fetchPaginatedData(`https://api.github.com/users/${username}/followers`, accessToken);
}

function fetchAllFollowings(username, accessToken) {
    return fetchPaginatedData(`https://api.github.com/users/${username}/following`, accessToken);
}

async function fetchPaginatedData(url, accessToken) {
    let allData = [];
    let page = 1;
    let response;

    url += `?page=${page}&per_page=100`;

    do {
        if (accessToken === "") {
            response = await fetch(url, {
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Accept": "application/vnd.github+json"
                }
            });
        } else {
            response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Accept": "application/vnd.github+json"
                }
            });
        }

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        allData = allData.concat(data);

        const linkHeader = response.headers.get('Link');
        const nextLink = extractNextLink(linkHeader);

        if (nextLink) {
            url = nextLink;
        } else {
            break;
        }

        page++;
    } while (true);

    return allData;
}

function extractNextLink(linkHeader) {
    if (!linkHeader) {
        return null;
    }

    const links = linkHeader.split(',');
    for (const link of links) {
        const [url, rel] = link.split(';');
        if (rel.includes('rel="next"')) {
            return url.trim().slice(1, -1);
        }
    }

    return null;
}


////////// display data //////////
function displayFollowers(followers) {
    //console.log(followers);
    $('#followers').text(followers.length);
}

function displayFollowing(followings) {
    //console.log(followings);
    $('#following').text(followings.length);
}

// check if empty arrays
function checkEmpty() {
    if (followerNames.length === 0) {
        $('#textNotFollowing').text("No Followers yet!");
    } else if (followersNotFollowing.length === 0) {
        $('#textNotFollowing').text("All followers are followed back by the user!");
    } else {
        $('#textNotFollowing').text("Here are the followers, but this user hasn't followed them.");
    }

    if (followingNames.length === 0) {
        $('#textNotFollowers').text("No followings yet!");
    } else if (followingNotFollowers.length === 0) {
        $('#textNotFollowers').text("The user is followed back by all followers!");
    } else {
        $('#textNotFollowers').text("Here are the followings, but they are not following this user.");
    }

    $('#textFollowersFollowing').text("Here are the followers who follow back.");
}

// display data 
function displayDataDiv(totalCountElement, currentPageElement, itemsPerPage, displayDiv, paginationDiv, paginatedArray, totalCountElementId, changePageFunction) {
    const startIndex = (currentPageElement - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedData = paginatedArray.slice(startIndex, endIndex);

    $(totalCountElement).text(paginatedArray.length);

    const profilesList = displayedData.map(name => {
        const avatarUrl = `https://github.com/${name.login}.png`;
        const githubProfileUrl = `https://github.com/${name.login}`;

        return `
        <a href="${githubProfileUrl}" target="_blank">
            <div class="userDataDiv">
                <img src="${avatarUrl}" alt="${name.login}'s Avatar" width="50" height="50">
                <p>${name.login}</p>
            </div>
        </a>`;
    });

    displayDiv.html(profilesList.join(''));

    const totalPages = Math.ceil(paginatedArray.length / itemsPerPage);
    const paginationButtons = Array.from({ length: totalPages }, (_, i) => i + 1);

    const paginationHtml = paginationButtons.map(page => {
        const activeClass = page === currentPageElement ? 'active' : '';
        return `<button class="m-1 btn btn-sm btn-outline-success ${activeClass}" onclick="${changePageFunction}(${page})">${page}</button>`;
    }).join('');

    paginationDiv.html(paginationHtml);

    $(".userDataDiv").hover(function() {
        $(this).css("background-color", "grey");
    }, function() {
        $(this).css("background-color", "");
    });
}

function displayFollowersNotFollowing() {
    const itemsPerPage = 100;
    displayDataDiv(
        '#followers-not-following-count',
        currentPage,
        itemsPerPage,
        $('#followers-but-not-Following'),
        $('#pagination-followers-but-not-Following'),
        followersNotFollowing,
        '#followers-not-following-count',
        'changePageFollowersNotFollowing'
    );
}

function displayFollowingNotFollowers() {
    const itemsPerPage = 100;
    displayDataDiv(
        '#following-not-followers-count',
        currentPage,
        itemsPerPage,
        $('#Following-but-not-followers'),
        $('#pagination-Following-but-not-followers'),
        followingNotFollowers,
        '#following-not-followers-count',
        'changePageFollowingNotFollowers'
    );
}

function displayFollowersFollowing() {
    const itemsPerPage = 100;
    displayDataDiv(
        '#followers-following-count',
        currentPage,
        itemsPerPage,
        $('#followers-following'),
        $('#pagination-followers-following'),
        followersFollowing,
        '#follows-following-count',
        'changePageFollowersFollowing'
    );
}

function changePageFollowersNotFollowing(page) {
    currentPage = page;
    displayFollowersNotFollowing();
}

function changePageFollowingNotFollowers(page) {
    currentPage = page;
    displayFollowingNotFollowers();
}

function changePageFollowersFollowing(page) {
    currentPage = page;
    displayFollowersFollowing();
}

////////// summary //////////
function updateSummary() {
    $('#summary-total-followers').text(followerNames.length);
    $('#summary-followed-back').text(followerNames.length - followersNotFollowing.length);
    $('#summary-not-followed-back').text(followersNotFollowing.length);

    $('#summary-total-followings').text(followingNames.length);
    $('#summary-followings-who-follow-back').text(followingNames.length - followingNotFollowers.length);
    $('#summary-followings-not-followed-back').text(followingNotFollowers.length);
}
