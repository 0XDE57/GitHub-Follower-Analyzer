let githubUsername;

let followerNames = [];
let followingNames = [];
let followersNotFollowing = [];
let followingNotFollowers = [];
let followersFollowing = [];

let currentPage = 1;


document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        //cant find #img-divs yet
        hideLoading(); // Hide the loading when the document is fully loaded
        initialView();
        ready();
    }
};

function ready() {

    document.querySelector('#github-form').onsubmit = function (event) {
        event.preventDefault();

        showLoading();
        document.querySelector('#form').style.display = 'none';

        githubUsername = document.querySelector('#github-username').value;
        githubFineGrainAccessToken = document.querySelector('#github-access-token').value;

        authenticateAndFetchData(githubUsername, githubFineGrainAccessToken);

    };

    // search new user
    document.querySelector('#searchNew').onclick = function () {
        initialView();

        document.querySelector('#github-username').val('');
        document.querySelector('#github-username').focus();
    };

    document.querySelector('#btnSortIDAsc').onclick = function () {
        followerNames.sort(sortID);
        followingNames.sort(sortID);
        followersNotFollowing.sort(sortID);
        followingNotFollowers.sort(sortID);
        followersFollowing.sort(sortID);
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    };

    document.querySelector('#btnSortIDDesc').onclick = function () {
        followerNames.sort(sortID).reverse();
        followingNames.sort(sortID).reverse();
        followersNotFollowing.sort(sortID).reverse();
        followingNotFollowers.sort(sortID).reverse();
        followersFollowing.sort(sortID).reverse();
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    };

    document.querySelector('#btnSortAsc').onclick = function () {
        followerNames.sort(sortIgnoreCase);
        followingNames.sort(sortIgnoreCase);
        followersNotFollowing.sort(sortIgnoreCase);
        followingNotFollowers.sort(sortIgnoreCase);
        followersFollowing.sort(sortIgnoreCase);
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    };

    document.querySelector('#btnSortDesc').onclick = function () {
        followerNames.sort(sortIgnoreCase).reverse();
        followingNames.sort(sortIgnoreCase).reverse();
        followersNotFollowing.sort(sortIgnoreCase).reverse();
        followingNotFollowers.sort(sortIgnoreCase).reverse();
        followersFollowing.sort(sortIgnoreCase).reverse();
        currentPage = 1;
        displayFollowersNotFollowing();
        displayFollowingNotFollowers();
        displayFollowersFollowing();
    };

    document.querySelector('#btnDownloadJSON').onclick = function () {
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
    };
};

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



function initialView() {
    document.querySelector('#form').style.display = '';
    document.querySelector('#userDetails').style.display = 'none';
    //document.querySelector('#img-divs').style.display = 'none';
    document.querySelector('#summary').style.display = 'none';
    document.querySelector('#followers-not-following-div').style.display = 'none';
    document.querySelector('#following-not-followers-div').style.display = 'none';
    document.querySelector('#followers-following-div').style.display = 'none';
    document.querySelector('#loading-container').style.display = 'none';
    document.querySelector('#searchNew').style.display = 'none';
}

function showLoading() {
    document.querySelector('#loading-container').style.display = '';

    document.querySelector('#userDetails').style.display = 'none';
    //document.querySelector('#img-divs').style.display = 'none';
    document.querySelector('#summary').style.display = 'none';
    document.querySelector('#followers-not-following-div').style.display = 'none';
    document.querySelector('#following-not-followers-div').style.display = 'none';
    document.querySelector('#followers-following-div').style.display = 'none';
    document.querySelector('#searchNew').style.display = 'none';
}

function hideLoading() {
    document.querySelector('#loading-container').style.display = 'none';

    document.querySelector('#userDetails').style.display = '';
    //document.querySelector('#img-divs').style.display = '';
    document.querySelector('#summary').style.display = '';
    document.querySelector('#followers-not-following-div').style.display = '';
    document.querySelector('#following-not-followers-div').style.display = '';
    document.querySelector('#followers-following-div').style.display = '';
    document.querySelector('#searchNew').style.display = '';
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

        document.querySelector('#userImage').setAttribute('src', user.avatar_url);
        document.querySelector('#userName').textContent = user.login;
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
        console.log("request: " + url)
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
    document.querySelector('#followers').textContent = followers.length;
}

function displayFollowing(followings) {
    //console.log(followings);
    document.querySelector('#following').textContent = followings.length;
}

// check if empty arrays
function checkEmpty() {
    if (followerNames.length === 0) {
        document.querySelector('#textNotFollowing').textContent = "No Followers yet!";
    } else if (followersNotFollowing.length === 0) {
        document.querySelector('#textNotFollowing').textContent = "All followers are followed back by the user!";
    } else {
        document.querySelector('#textNotFollowing').textContent = "Here are the followers, but this user hasn't followed them.";
    }

    if (followingNames.length === 0) {
        document.querySelector('#textNotFollowers').textContent = "No followings yet!";
    } else if (followingNotFollowers.length === 0) {
        document.querySelector('#textNotFollowers').textContent = "The user is followed back by all followers!";
    } else {
        document.querySelector('#textNotFollowers').textContent = "Here are the followings, but they are not following this user.";
    }

    document.querySelector('#textFollowersFollowing').textContent = "Here are the followers who follow back.";
}

// display data 
function displayDataDiv(totalCountElement, currentPageElement, itemsPerPage, displayDiv, paginationDiv, paginatedArray, totalCountElementId, changePageFunction) {
    const startIndex = (currentPageElement - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedData = paginatedArray.slice(startIndex, endIndex);

    document.querySelector(totalCountElement).textContent = paginatedArray.length;

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

    displayDiv.innerHTML = profilesList.join('');

    const totalPages = Math.ceil(paginatedArray.length / itemsPerPage);
    const paginationButtons = Array.from({ length: totalPages }, (_, i) => i + 1);

    const paginationHtml = paginationButtons.map(page => {
        const activeClass = page === currentPageElement ? 'active' : '';
        return `<button class="m-1 btn btn-sm btn-outline-success ${activeClass}" onclick="${changePageFunction}(${page})">${page}</button>`;
    }).join('');

    paginationDiv.innerHTML = paginationHtml;

    document.querySelector('.userDataDiv').onMouseover = function() {
        $(this).css("background-color", "grey");
    }, function() {
        $(this).css("background-color", "");
    };
}

function displayFollowersNotFollowing() {
    const itemsPerPage = 100;
    displayDataDiv(
        '#followers-not-following-count',
        currentPage,
        itemsPerPage,
        document.querySelector('#followers-but-not-Following'),
        document.querySelector('#pagination-followers-but-not-Following'),
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
        document.querySelector('#Following-but-not-followers'),
        document.querySelector('#pagination-Following-but-not-followers'),
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
        document.querySelector('#followers-following'),
        document.querySelector('#pagination-followers-following'),
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
    document.querySelector('#summary-total-followers').textContent = followerNames.length;
    document.querySelector('#summary-followed-back').textContent = followerNames.length - followersNotFollowing.length;
    document.querySelector('#summary-not-followed-back').textContent = followersNotFollowing.length;

    document.querySelector('#summary-total-followings').textContent = followingNames.length;
    document.querySelector('#summary-followings-who-follow-back').textContent = followingNames.length - followingNotFollowers.length;
    document.querySelector('#summary-followings-not-followed-back').textContent = followingNotFollowers.length;
}
